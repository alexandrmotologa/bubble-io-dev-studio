require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { BubbleCloudClient } = require('./bubbleClient');

const app = express();
const PORT = process.env.PORT || 8080;
const API_SECRET = process.env.SYNC_API_SECRET || '';

// Security hardening
app.disable('x-powered-by');

// Enable CORS for all clients (including local Dev Studio desktop)
app.use(cors());
app.use(express.json({ limit: '250mb' }));

// Lightweight sliding-window rate limiter (zero extra dependencies)
const ipRequests = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 30; // 30 sync requests per IP per window

// Clean up stale rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, 10 * 60 * 1000);

function rateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let clientData = ipRequests.get(ip);
  if (!clientData || now > clientData.resetTime) {
    clientData = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    ipRequests.set(ip, clientData);
    return next();
  }

  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    const waitSeconds = Math.ceil((clientData.resetTime - now) / 1000);
    return res.status(429).json({
      success: false,
      error: `Too many requests from this IP. Please wait ${waitSeconds} seconds before trying again.`
    });
  }

  clientData.count++;
  next();
}

const client = new BubbleCloudClient({
  sessionCookie: process.env.BUBBLE_BOT_SESSION || ''
});

// Middleware for optional API Key authorization
function requireAuth(req, res, next) {
  if (!API_SECRET) return next();
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.slice(7) === API_SECRET) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API secret token' });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Bubble.io Dev Studio Cloud Sync Engine',
    version: '1.0.0',
    botSessionConfigured: Boolean(process.env.BUBBLE_BOT_SESSION),
    timestamp: Date.now()
  });
});

// Status endpoint
app.get('/v1/status', (req, res) => {
  res.json({
    status: 'ready',
    authenticated: Boolean(process.env.BUBBLE_BOT_SESSION),
    features: ['direct-cloud-sync', 'branch-switching', 'stats-calculator']
  });
});

// Primary Sync Endpoint (Cloud-to-Cloud AST Retrieval)
app.post('/v1/sync', rateLimiter, requireAuth, async (req, res) => {
  const { appId, branch = 'test', sessionCookie } = req.body;

  if (!appId || typeof appId !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing required field: appId' });
  }

  try {
    console.log(`[CloudSync] Initiating sync for app: ${appId} (branch: ${branch})...`);
    const result = await client.fetchAppTree(appId, branch, sessionCookie);
    console.log(`[CloudSync] Successfully fetched app: ${appId} (${result.stats.pagesCount} pages, ${result.stats.workflowsCount} workflows)`);
    return res.json(result);
  } catch (error) {
    console.error(`[CloudSync] Error fetching ${appId}:`, error.message);
    return res.status(500).json({
      success: false,
      appId,
      error: error.message || 'Failed to fetch application schema from Bubble.io'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Bubble Cloud Sync Engine running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Bot session configured: ${Boolean(process.env.BUBBLE_BOT_SESSION)}`);
  console.log(`====================================================`);
});
