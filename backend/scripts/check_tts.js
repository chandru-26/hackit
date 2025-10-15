require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');

const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

async function run() {
  console.log('Using key present?', !!key);
  const body = { text: 'Hello from test', model_id: 'eleven_monolingual_v1' };
  try {
    const resp = await axios.post(url, body, { headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' });
    console.log('xi-api-key TTS resp status', resp.status, 'bytes', resp.data?.byteLength);
  } catch (e) {
    if (e.response) console.error('xi-api-key TTS resp', e.response.status, e.response.data ? e.response.data.toString() : JSON.stringify(e.response.data)); else console.error('xi-api-key TTS err', e.message);
  }
  try {
    const resp2 = await axios.post(url, body, { headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' });
    console.log('bearer TTS resp status', resp2.status, 'bytes', resp2.data?.byteLength);
  } catch (e) {
    if (e.response) console.error('bearer TTS resp', e.response.status, JSON.stringify(e.response.data)); else console.error('bearer TTS err', e.message);
  }
}

run();
