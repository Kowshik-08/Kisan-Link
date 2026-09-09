require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'https://kisanlink-drab.vercel.app';
const CLIENT_URL = FRONTEND_URL;

const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'kisanlink-dev-jwt-secret-key-32chars-min');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (NODE_ENV === 'production' ? null : 'kisanlink-dev-refresh-secret-key-32chars');

if (NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.warn('⚠️ WARNING: JWT_SECRET or JWT_REFRESH_SECRET is not set in production environment variables! Using fallback temporary keys.');
  }
  if (!DATABASE_URL) {
    console.warn('⚠️ WARNING: DATABASE_URL is not set in production! Falling back to in-memory store.');
  }
}

module.exports = {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  FRONTEND_URL,
  CLIENT_URL,
  JWT_SECRET: JWT_SECRET || 'kisanlink-production-fallback-jwt-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  JWT_REFRESH_SECRET: JWT_REFRESH_SECRET || 'kisanlink-production-fallback-refresh-secret-2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};

