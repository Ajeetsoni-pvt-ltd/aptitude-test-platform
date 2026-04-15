// backend/src/server.ts
// ─────────────────────────────────────────────────────────────
// Server Entry Point
// Yahan sirf server start hota hai + DB connect hoti hai
// Graceful shutdown bhi handle hota hai (production best practice)
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config(); // ✅

import app from './app';
import connectDB from './config/db';

// Environment variables se port lo, default 5000
const PORT = process.env.PORT || 5000;

// ─── Start Server ──────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // Step 1: MongoDB Atlas se connect karo
    await connectDB();

    // Step 2: Express server start karo
    const server = app.listen(PORT, () => {
      console.log('─────────────────────────────────────────');
      console.log(`🚀 Server running on PORT: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log('─────────────────────────────────────────');
    });

    // ─── Graceful Shutdown ───────────────────────────────────
    // Docker/Kubernetes SIGTERM signal pe server ko properly band karo
    // Forceful kill se data corruption ho sakti hai — isliye graceful shutdown zaroori hai
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Non-zero exit = error (CI/CD pipelines ko pata chale)
  }
};

startServer();
