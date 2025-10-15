require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Only keep Anam-related routes for the simplified landing + demo app
const anamRoute = require('./routes/anam');
const anamProxyWs = require('./routes/anam-proxy-ws');

const app = express();
app.use(cors());
// Increase body size limits to allow base64-encoded resume uploads (PDFs can be several MBs when base64)
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ limit: '12mb', extended: true }));

// Mount only Anam endpoints
app.use('/api/anam', anamRoute);
app.use('/api/anam-proxy', anamProxyWs);

// No additional endpoints required for the trimmed backend. Anam routes handle session/token/engine logic.

const DEFAULT_PORT = process.env.PORT || 8001;
function startServer(port) {
  // Create an HTTP server so we can handle WebSocket upgrades
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ noServer: true });

  // On upgrade, handle proxying to the Anam signalling endpoint
  server.on('upgrade', async (request, socket, head) => {
    try {
      const parsed = new URL(request.url || '', `http://${request.headers.host}`);
      console.log('[WS PROXY] Upgrade request for:', request.url);

      if (parsed.pathname === '/api/anam/ws-proxy') {
        const anam = require('./routes/anam');
        const t0 = Date.now();
        const cached = anam.getCachedEngineForProxy && await anam.getCachedEngineForProxy();
        const dt = Date.now() - t0;
        if (!cached) {
          console.error(`[WS PROXY] ❌ No engine session returned (lookup took ${dt}ms). Sending 503.`);
        } else {
          const sidDbg = cached.session_id || cached.sessionId || cached.id;
          const tokenDbg = (cached.token || cached.sessionToken || (cached.data && cached.data.sessionToken) || '').slice(0, 12) + '...';
          console.log(`[WS PROXY] ✅ Engine session materialized in ${dt}ms. sid=${sidDbg} token~=${tokenDbg}`);
        }

        if (!cached) {
          console.error('[WS PROXY] No cached engine session available. Cannot proxy. Closing connection.');
          socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
          socket.destroy();
          return;
        }

        const sessionId = cached.session_id || cached.sessionId || cached.id;
        const token = cached.token || cached.sessionToken || (cached.data && cached.data.sessionToken);

        if (!sessionId || !token) {
          console.error(`[WS PROXY] Missing session ID or token in cached engine. SessionID: ${!!sessionId}, Token: ${!!token}. Closing connection.`);
          socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
          socket.destroy();
          return;
        }

        // Build candidate upstream URLs (aggressive discovery in case fields differ)
        const candidateUrls = [];
        const protoList = ['wss'];
        const defaultHost = cached.engineHost || 'connect-eu.anam.ai';
        const defaultEndpoint = cached.signallingEndpoint || '/v1/webrtc/engines/anm/ws';
        const possSessionParams = [
          `session_id=${encodeURIComponent(sessionId)}&sessionToken=${encodeURIComponent(token)}`,
          `session_id=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`,
          `sessionId=${encodeURIComponent(sessionId)}&sessionToken=${encodeURIComponent(token)}`
        ];

        if (cached.signallingUrl && /^wss?:/.test(cached.signallingUrl)) {
          // If engine already provided full signalling ws URL, try raw forms with param variations
            possSessionParams.forEach(p => {
              const sep = cached.signallingUrl.includes('?') ? '&' : '?';
              candidateUrls.push(`${cached.signallingUrl}${sep}${p}`);
            });
            candidateUrls.push(cached.signallingUrl); // last attempt no extra params
        }

        protoList.forEach(proto => {
          const hostVariants = [defaultHost, `connect.anam.ai`, `connect-eu.anam.ai`, `connect-us.anam.ai`];
          hostVariants.forEach(h => {
            const epVariants = [defaultEndpoint, '/v1/webrtc/engines/anm/ws', '/v1/engine/ws'];
            epVariants.forEach(ep => {
              possSessionParams.forEach(p => {
                const sep = ep.includes('?') ? '&' : '?';
                candidateUrls.push(`${proto}://${h}${ep}${sep}${p}`);
              });
            });
          });
        });

        // Deduplicate
        const seen = new Set();
        const dedupedCandidates = candidateUrls.filter(u => { if (seen.has(u)) return false; seen.add(u); return true; });
        console.log(`[WS PROXY] Built ${dedupedCandidates.length} candidate upstream URLs to try.`);

        let destWs = null;
        let chosenUrl = null;
        const headers = { 'Authorization': `Bearer ${token}` };

        for (const url of dedupedCandidates.slice(0, 25)) { // cap attempts
          try {
            console.log('[WS PROXY] Attempting upstream candidate:', url);
            destWs = new WebSocket(url, { headers });
            chosenUrl = url;
            const openResult = await new Promise((resolve, reject) => {
              const to = setTimeout(() => reject(new Error('timeout_open_1500ms')), 1500);
              destWs.once('open', () => { clearTimeout(to); resolve(true); });
              destWs.once('error', (err) => { clearTimeout(to); reject(err); });
            });
            if (openResult) {
              console.log('[WS PROXY] ✅ Upstream candidate succeeded:', url);
              break;
            }
          } catch (err) {
            console.warn('[WS PROXY] Candidate failed:', url, err.message);
            try { destWs && destWs.terminate(); } catch(e) {}
            destWs = null;
            continue;
          }
        }

        if (!destWs) {
          console.error('[WS PROXY] ❌ All upstream candidates failed. Returning 502.');
          socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
          try { socket.destroy(); } catch(e) {}
          return;
        }

        console.log('[WS PROXY] Using upstream URL:', chosenUrl);

        const connectionTimeout = setTimeout(() => {
          console.error('[WS PROXY] Upstream connection timed out after 10s.');
          try { destWs.terminate(); } catch(e) {}
          try { socket.destroy(); } catch(e) {}
        }, 10000);
        // If already open (should be, because we waited in the candidate loop), bridge immediately.
        const bridge = () => {
          clearTimeout(connectionTimeout);
          console.log('[WS PROXY] Bridging client connection to established upstream.');
          wss.handleUpgrade(request, socket, head, (ws) => {
            console.log('[WS PROXY] Client WebSocket connection established.');
            const pipe = (from, to, fromName, toName) => {
              from.on('message', (msg) => {
                if (process.env.DEBUG_WS === 'true') console.log(`[WS PROXY] Message from ${fromName} to ${toName}`);
                try { to.send(msg); } catch (e) { console.error(`[WS PROXY] Error sending to ${toName}:`, e.message); }
              });
              from.on('close', (code, reason) => {
                console.log(`[WS PROXY] ${fromName} connection closed: ${code} ${reason}`);
                try { to.close(code, String(reason)); } catch (e) { console.error(`[WS PROXY] Error closing ${toName}:`, e.message); }
              });
              from.on('error', (err) => {
                console.error(`[WS PROXY] Error on ${fromName} connection:`, err.message);
                try { to.close(); } catch(e) {}
              });
            };
            pipe(ws, destWs, 'Client', 'Upstream');
            pipe(destWs, ws, 'Upstream', 'Client');
          });
        };

        if (destWs.readyState === WebSocket.OPEN) {
          bridge();
        } else {
          destWs.once('open', bridge);
        }

        destWs.on('error', (err) => {
          clearTimeout(connectionTimeout);
          console.error('[WS PROXY] Upstream WebSocket error:', err.message);
          console.error('[WS PROXY] Failed to connect to:', destUrl);
          console.error('[WS PROXY] Session debug:', {
            sessionId,
            hasToken: !!token,
            tokenPrefix: (token || '').slice(0, 10),
            signallingUrl: cached && cached.signallingUrl,
            engineHost: cached && cached.engineHost,
            signallingEndpoint: cached && cached.signallingEndpoint
          });
          try {
            socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
            socket.destroy();
          } catch(e) {}
        });

      } else {
        console.log('[WS PROXY] Unhandled upgrade path:', parsed.pathname);
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
      }
    } catch (e) {
      console.error('[WS PROXY] Unhandled error during upgrade:', e.message);
      try { socket.destroy(); } catch(er) {}
    }
  });

  server.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${Number(port) + 1}`);
      startServer(Number(port) + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(DEFAULT_PORT);
