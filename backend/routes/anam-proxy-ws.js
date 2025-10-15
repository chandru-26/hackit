const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const url = require('url');
const anamRoute = require('./anam');

const router = express.Router();

// Mount this route at /api/anam/ws-proxy
// It upgrades to WebSocket and proxies to the real Anam signalling endpoint
// attaching Authorization header (Bearer <token>) retrieved from the
// server-side cached engine/session body.

router.get('/ws-proxy', (req, res) => {
  // This endpoint is only used for the HTTP -> WS upgrade. The actual
  // proxying occurs on upgrade event handled in server initialization.
  res.status(200).json({ ok: true, info: 'websocket proxy endpoint' });
});

module.exports = router;
