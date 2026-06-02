// backend/src/server.ts
// ─────────────────────────────────────────────────────────────
// Server Entry Point
// Yahan sirf server start hota hai + DB connect hoti hai
// Graceful shutdown bhi handle hota hai (production best practice)
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import app from './app';
import connectDB from './config/db';

// Environment variables se port lo, default 5000
const PORT = process.env.PORT || 5000;

// ─── Environment Variable Validation ───────────────────────────
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('─── Environment Variable Check ───────────────────');

  // Critical (server won't work without these)
  const critical = ['MONGO_URI', 'JWT_SECRET'];
  for (const key of critical) {
    if (!process.env[key]?.trim()) {
      console.error(`❌ CRITICAL: ${key} is missing!`);
    } else {
      console.log(`  ✅ ${key} — configured`);
    }
  }

  // Important services
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  console.log(geminiKey
    ? `  ✅ GEMINI_API_KEY — configured (model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})`
    : '  ⚠️  GEMINI_API_KEY — NOT SET (AI features will be disabled)'
  );

  const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim();
  console.log(cloudinaryConfigured
    ? `  ✅ CLOUDINARY — configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`
    : `  ${isProduction ? '⚠️ ' : 'ℹ️ '} CLOUDINARY — NOT SET (images will be stored locally)`,
  );

  const smtpConfigured = process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim();
  console.log(smtpConfigured
    ? '  ✅ SMTP — configured'
    : '  ⚠️  SMTP — NOT SET (email features will be disabled)'
  );

  console.log('──────────────────────────────────────────────────');
};

// ─── Start Server ──────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // Step 0: Validate environment variables
    validateEnv();

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
