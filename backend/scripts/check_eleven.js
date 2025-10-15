require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');

const key = process.env.ELEVENLABS_API_KEY;
console.log('ELEVENLABS_API_KEY present?', !!key);
console.log('KEY prefix:', key ? key.slice(0, 12) : 'none');

const url = 'https://api.elevenlabs.io/v1/voices';

async function run() {
  if (!key) {
    console.error('No key in .env');
    process.exit(1);
  }
  try {
    const r = await axios.get(url, { headers: { 'xi-api-key': key } });
    console.log('XI success', r.status, r.data?.length ? `voices:${r.data.length}` : 'no-data');
  } catch (e) {
    if (e.response) console.error('XI resp', e.response.status, JSON.stringify(e.response.data)); else console.error('XI err', e.message);
  }
  try {
    const r = await axios.get(url, { headers: { Authorization: `Bearer ${key}` } });
    console.log('Bearer success', r.status, r.data?.length ? `voices:${r.data.length}` : 'no-data');
  } catch (e) {
    if (e.response) console.error('Bearer resp', e.response.status, JSON.stringify(e.response.data)); else console.error('Bearer err', e.message);
  }
}

run();
