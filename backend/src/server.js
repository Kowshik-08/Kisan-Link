const app = require('./app');
const prisma = require('./config/db');
const { PORT, NODE_ENV } = require('./config/env');

async function startServer() {
  try {
    // 1. Verify Database Connection
    console.log('🔄 Connecting to database via Prisma...');
    try {
      await prisma.$connect();
      console.log('✅ PostgreSQL database connected successfully.');
    } catch (dbErr) {
      console.warn('⚠️ Could not connect to PostgreSQL on localhost:5432.');
      console.log('🌾 Falling back to In-Memory Mock Database with pre-seeded data...');
      if (typeof prisma.$switchToMock === 'function') {
        prisma.$switchToMock();
      }
      await prisma.$connect();
      console.log('✅ In-Memory Mock Database active.');
    }

    // 2. Start HTTP Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 KisanLink Backend Server running in [${NODE_ENV}] mode on port: ${PORT}`);
      console.log(`🌐 Local Web App: http://localhost:${PORT} (or http://127.0.0.1:${PORT})`);
      console.log(`🔗 API Base URL:  http://localhost:${PORT}/api/v1`);
      console.log(`🩺 Health Checks: http://localhost:${PORT}/api/health & http://localhost:${PORT}/api/v1/health`);
    });

    // 3. Graceful Shutdown Handlers
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        console.log('🔌 HTTP server closed.');
        await prisma.$disconnect();
        console.log('💾 Database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
