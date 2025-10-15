const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists before accessing engine_session.json
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Simple in-memory cache to prevent frequent session requests to Anam
let _anam_session_cache = null; // { body, expiresAt }
const ANAM_SESSION_TTL = 55 * 1000; // 55 seconds
// Cache for engine sessions (longer-lived)
let _anam_engine_cache = null; // { body, expiresAt }
const ANAM_ENGINE_TTL = 5 * 60 * 1000; // 5 minutes

// File to persist engine session
const ENGINE_SESSION_FILE = path.join(__dirname, '../data/engine_session.json');

// Helper to load persisted engine session
const loadPersistedEngineSession = () => {
  try {
    if (fs.existsSync(ENGINE_SESSION_FILE)) {
      const data = fs.readFileSync(ENGINE_SESSION_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && parsed.expiresAt > Date.now()) {
        const sid = parsed.session_id || parsed.engine_session || parsed.id || (parsed.body && (parsed.body.session_id || parsed.body.engine_session || parsed.body.id));
        if (sid) {
          const normalized = { ...parsed, session_id: sid };
          console.log('♻️ Loaded persisted engine session from disk:', normalized.session_id);
          return normalized;
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Failed to load persisted engine session:', e.message);
  }
  return null;
};

// Helper to persist engine session to disk
const persistEngineSession = (session) => {
  try {
    const sid = session && (session.session_id || session.engine_session || session.id || (session.body && (session.body.session_id || session.body.engine_session || session.body.id)));
    const data = { ...session, session_id: sid, expiresAt: Date.now() + ANAM_ENGINE_TTL };
    fs.writeFileSync(ENGINE_SESSION_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('💾 Persisted engine session to disk:', data.session_id);
  } catch (e) {
    console.warn('⚠️ Failed to persist engine session:', e.message);
  }
};

// Load persisted session on startup
const startupSession = loadPersistedEngineSession();
if (startupSession) {
  _anam_engine_cache = { body: startupSession, expiresAt: startupSession.expiresAt };
  console.log(`♻️ Initialized in-memory engine cache from persisted session ${startupSession.session_id}`);
}

// Simple server-side exchange for Anam session token
// POST /api/anam/session
router.post('/session', async (req, res) => {
  const anamKey = process.env.ANAM_API_KEY;
  if (!anamKey) {
    return res.status(400).json({ error: 'ANAM_API_KEY not configured on server' });
  }

  const anamUrl = process.env.ANAM_TRANSCRIBE_URL || 'https://api.anam.ai/v1/auth/session-token';
  const payload = req.body || {};
  if (!payload.personaConfig) {
    const persona = {};
    if (process.env.ANAM_AVATAR_ID) persona.avatarId = process.env.ANAM_AVATAR_ID;
    if (process.env.ANAM_VOICE_ID) persona.voiceId = process.env.ANAM_VOICE_ID;
    if (process.env.ANAM_LLM_ID) persona.llmId = process.env.ANAM_LLM_ID;
    persona.name = persona.name || 'Cara';
    payload.personaConfig = persona;
  }

  try {
    if (_anam_session_cache && _anam_session_cache.expiresAt > Date.now()) {
      return res.status(200).json({ ok: true, status: 200, body: _anam_session_cache.body, cached: true });
    }

    const resp = await axios.post(anamUrl, payload, {
      headers: {
        'Authorization': `Bearer ${anamKey}`,
        'Content-Type': 'application/json'
      }
    });

    const body = resp.data;

    if (resp.status >= 200 && resp.status < 300) {
      _anam_session_cache = { body, expiresAt: Date.now() + ANAM_SESSION_TTL };
      return res.status(200).json({ ok: true, status: resp.status, body });
    } else {
      console.error('Anam session API request failed:', { status: resp.status, body });
      return res.status(resp.status).json({ ok: false, error: 'anam_session_failed', detail: body });
    }
  } catch (e) {
    console.error('Anam session request failed unexpectedly', e.response ? { status: e.response.status, data: e.response.data } : e.message);
    return res.status(500).json({ error: 'Anam request failed', detail: e.response ? e.response.data : String(e) });
  }
});

// Simpler: GET session token only (used by direct frontend SDK). Returns { sessionToken }
router.get('/token', async (req, res) => {
  const anamKey = process.env.ANAM_API_KEY;
  if (!anamKey) return res.status(400).json({ error: 'ANAM_API_KEY not configured on server' });
  try {
    const authUrl = process.env.ANAM_TRANSCRIBE_URL || 'https://api.anam.ai/v1/auth/session-token';
    // Accept persona query params and pass systemPrompt and role if provided
    const personaConfig = {
      name: req.query.name || 'Cara',
      avatarId: req.query.avatarId || process.env.ANAM_AVATAR_ID,
      voiceId: req.query.voiceId || process.env.ANAM_VOICE_ID,
      llmId: req.query.llmId || process.env.ANAM_LLM_ID
    };
    if (req.query.systemPrompt) personaConfig.systemPrompt = req.query.systemPrompt;
    if (req.query.prompt) personaConfig.systemPrompt = req.query.prompt;
    if (req.query.role) personaConfig.role = req.query.role;
    const resp = await axios.post(authUrl, { personaConfig }, {
      headers: { 'Authorization': `Bearer ${anamKey}`, 'Content-Type': 'application/json' }
    });
    const token = resp.data && (resp.data.sessionToken || resp.data.token || resp.data.data && (resp.data.data.sessionToken || resp.data.data.token));
    if (!token) return res.status(502).json({ error: 'no_token_returned', raw: resp.data });
    return res.json({ sessionToken: token });
  } catch (e) {
    console.error('[ANAM /token] Failed to obtain session token', e.response ? e.response.status : e.message);
    return res.status(502).json({ error: 'token_exchange_failed', detail: e.response ? e.response.data : e.message });
  }
});

// Expose a helper for server-side WS proxy to access the cached engine body
async function getCachedEngineForProxy () {
  console.log('[WS PROXY HELPER] Accessing engine session for proxy...');
  try {
    // 1. Check in-memory cache (now the primary source)
    if (_anam_engine_cache && _anam_engine_cache.body && _anam_engine_cache.expiresAt > Date.now()) {
      console.log(`[WS PROXY HELPER] ✅ Found valid session in-memory cache: ${_anam_engine_cache.body.session_id}`);
      return _anam_engine_cache.body;
    }
    if (_anam_engine_cache) {
        console.log(`[WS PROXY HELPER] ⚠️ In-memory cache was present but expired.`);
    }

    // 2. If no valid in-memory cache, create a new session.
    // The startup logic should have already loaded from disk if available.
    console.log('[WS PROXY HELPER] No valid session in memory. Creating a new one on-demand.');
    const result = await createEngineSession(); // Pass no persona, use defaults
    if (result && result.ok && result.body) {
      console.log(`[WS PROXY HELPER] ✅ Successfully created new on-demand session: ${result.body.session_id}`);
      // createEngineSession populates the cache, so it will be available next time.
      return result.body;
    }

    console.error('[WS PROXY HELPER] ❌ Failed to create new engine on-demand.', result);
    return null; // Explicitly return null on failure

  } catch (e) {
    console.error('[WS PROXY HELPER] ❌ Exception in getCachedEngineForProxy:', e.message);
    return null;
  }
}

// Create or return a cached engine session
// POST /api/anam/engine
router.post('/engine', async (req, res) => {
  try {
    const personaConfig = req.body && req.body.personaConfig ? req.body.personaConfig : undefined;
    const result = await createEngineSession(personaConfig);
    if (result && result.ok && result.body) {
      return res.status(result.status || 200).json(result.body);
    }
    return res.status(result.status || 502).json(result);
  } catch (e) {
    console.error('Engine endpoint failed', e && e.message);
    return res.status(500).json({ ok: false, error: 'engine_exception', detail: String(e) });
  }
});

// Helper to create engine session (auth exchange -> engine/session) with caching and normalization
async function createEngineSession(personaConfig) {
  const anamKey = process.env.ANAM_API_KEY;
  if (!anamKey) {
    console.error('[ENGINE HELPER] ANAM_API_KEY is not configured.');
    return { ok: false, error: 'ANAM_API_KEY not configured', status: 400 };
  }

  if (_anam_engine_cache && _anam_engine_cache.expiresAt > Date.now()) {
    const cachedBody = _anam_engine_cache.body || _anam_engine_cache;
    console.log('[ENGINE HELPER] Returning cached engine session.');
    return { ok: true, cached: true, body: cachedBody, status: 200 };
  }
  console.log('[ENGINE HELPER] No valid cache. Proceeding to create new engine session.');

  // 1. Get a session token
  let authBody = null;
  if (_anam_session_cache && _anam_session_cache.expiresAt > Date.now()) {
    authBody = _anam_session_cache.body;
    console.log('[ENGINE HELPER] Using cached auth token.');
  } else {
    const authUrl = process.env.ANAM_TRANSCRIBE_URL || 'https://api.anam.ai/v1/auth/session-token';
    console.log(`[ENGINE HELPER] Getting new auth token from ${authUrl}...`);
    try {
      const authResp = await axios.post(authUrl, personaConfig ? { personaConfig } : {}, {
        headers: { 'Authorization': `Bearer ${anamKey}`, 'Content-Type': 'application/json' }
      });
      authBody = authResp.data;
      _anam_session_cache = { body: authBody, expiresAt: Date.now() + ANAM_SESSION_TTL };
      console.log('[ENGINE HELPER] Successfully obtained new auth token.');
    } catch (e) {
      console.error('❌ [FATAL] Failed to get Anam auth token.');
      if (e.response) {
        console.error(`❌ Anam Auth API returned status ${e.response.status}:`, e.response.data);
      } else {
        console.error('❌ Anam Auth API request error:', e.message);
      }
      return { ok: false, error: 'anam_auth_failed', detail: e.response ? e.response.data : e.message, status: 502 };
    }
  }

  const token = authBody?.sessionToken || authBody?.token || authBody?.data?.sessionToken || authBody?.data?.token || (authBody?.body?.sessionToken);
  if (!token) {
    console.error('❌ [FATAL] Auth response from Anam did not contain a token.', authBody);
    return { ok: false, error: 'no_auth_token_from_anam', body: authBody, status: 502 };
  }
  console.log('[ENGINE HELPER] Auth token is valid. Proceeding to create engine session.');

  // 2. Create engine/session using the token
  const engineUrl = 'https://api.anam.ai/v1/engine/session';
  console.log(`[ENGINE HELPER] Creating engine session at ${engineUrl}...`);
  try {
    const engineResp = await axios.post(engineUrl, personaConfig ? { personaConfig } : {}, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });

    const engineBody = engineResp.data;
    const sid = engineBody.session_id || engineBody.sessionId || engineBody.id;
    if (!sid) {
      console.error('❌ [FATAL] Engine session response from Anam did not contain a session_id.', engineBody);
      return { ok: false, error: 'no_session_id_from_anam', body: engineBody, status: 502 };
    }

    console.log('[ENGINE HELPER] Successfully created engine session:', sid);
    const normalized = { ...engineBody, session_id: sid, token }; // Pass token along
    _anam_engine_cache = { body: normalized, expiresAt: Date.now() + ANAM_ENGINE_TTL };
    persistEngineSession(normalized);
    return { ok: true, body: normalized, status: 200 };

  } catch (e) {
    console.error('❌ [FATAL] Failed to create Anam engine session.');
    if (e.response) {
      console.error(`❌ Anam Engine API returned status ${e.response.status}:`, e.response.data);
    } else {
      console.error('❌ Anam Engine API request error:', e.message);
    }
    return { ok: false, error: 'engine_session_failed', detail: e.response ? e.response.data : e.message, status: 502 };
  }
}

// Admin helper: clear persisted and in-memory engine cache
router.post('/engine/clear', (req, res) => {
  _anam_engine_cache = null;
  _anam_session_cache = null;
  try {
    if (fs.existsSync(ENGINE_SESSION_FILE)) fs.unlinkSync(ENGINE_SESSION_FILE);
  } catch (e) {
    console.warn('Failed to remove persisted engine session file', e && e.message);
  }
  return res.json({ ok: true, cleared: true });
});

// Debug endpoint to inspect current engine cache (DO NOT expose in production without auth)
router.get('/engine/debug', (req, res) => {
  const now = Date.now();
  const engine = _anam_engine_cache && _anam_engine_cache.body;
  const expiresAt = _anam_engine_cache && _anam_engine_cache.expiresAt;
  res.json({
    ok: true,
    hasEngine: !!engine,
    sessionId: engine && (engine.session_id || engine.sessionId || engine.id),
    remainingMs: expiresAt ? (expiresAt - now) : null,
    expiresAt,
    now,
    engineKeys: engine ? Object.keys(engine) : [],
    // Provide selective fields helpful for WS debug
    signallingUrl: engine && engine.signallingUrl,
    engineHost: engine && engine.engineHost,
    signallingEndpoint: engine && engine.signallingEndpoint,
    tokenPreview: engine && engine.token ? engine.token.slice(0, 15) + '...' : null
  });
});

module.exports = router;
// Re-attach helper AFTER assigning router so it is not lost
module.exports.getCachedEngineForProxy = getCachedEngineForProxy;
