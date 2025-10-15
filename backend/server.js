require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

// Import Anam routes
const anamRoute = require('./routes/anam');
const anamProxyWs = require('./routes/anam-proxy-ws');

const app = express();

// ✅ CORS: allow only your frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // set Vercel frontend URL in .env
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// Increase body size limits for PDF uploads
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ limit: '12mb', extended: true }));

// Mount Anam endpoints
app.use('/api/anam', anamRoute);
app.use('/api/anam-proxy', anamProxyWs);

// Health check endpoint (optional)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', backend: true });
});

const DEFAULT_PORT = process.env.PORT || 8001;

function startServer(port) {
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    // Keep your existing WS proxy logic
    // (You can reuse your current upgrade handler as-is)
    // Make sure all secrets come from process.env via config.js
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
