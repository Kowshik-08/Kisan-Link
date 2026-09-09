const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { FRONTEND_URL, CLIENT_URL, NODE_ENV } = require('./config/env');
const apiRoutes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

const app = express();

// 1. Production-ready Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  FRONTEND_URL,
  CLIENT_URL,
  'https://kisanlink-drab.vercel.app',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
]
  .filter(Boolean)
  .flatMap((u) => u.split(',').map((s) => s.trim().replace(/\/+$/, '')));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server, same-origin)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedOrigin) ||
        // Allow any Vercel preview/production deployment for kisanlink
        /^https:\/\/kisanlink(-[a-z0-9-]+)?\.vercel\.app$/.test(normalizedOrigin) ||
        // Allow local dev origins
        (NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS Error: Origin ${origin} not permitted`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 2. Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 4. Production Health Check Endpoints
const healthPayload = () => ({
  status: 'ok',
  service: 'KisanLink Backend REST API',
  environment: NODE_ENV,
  timestamp: new Date().toISOString(),
});

app.get('/api/health', (req, res) => res.status(200).json(healthPayload()));
app.get('/health', (req, res) => res.status(200).json(healthPayload()));

// 5. API Routes Base
app.use('/api/v1', apiRoutes);

// 5. Static Frontend Serving
const path = require('path');
const fs = require('fs');
const frontendPath = path.join(__dirname, '../../frontend');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath, { etag: false, maxAge: 0 }));
}

// Root Index Route (fallback if frontend index.html not served)
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
    return res.sendFile(path.join(frontendPath, 'index.html'));
  }
  res.json({
    name: 'KisanLink API',
    version: '1.0.0',
    description: 'Market Linkage & Price Discovery for Farmers (SIH26132)',
    docs: '/api/v1/health',
  });
});

// 5. 404 Not Found Catch-all
app.use(notFoundHandler);

// 6. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
