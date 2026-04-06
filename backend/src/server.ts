// backend/src/server.ts
// ─────────────────────────────────────────────────────────────
// Server Entry Point with Socket.IO for Real-time Proctoring
// Yahan sirf server start hota hai + DB connect hoti hai
// Socket.IO setup live proctoring ke liye
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config(); // ✅

import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import connectDB from './config/db';
import { initializeProctoringSocket } from './socket/proctoringSocket';

// Environment variables se port lo, default 5000
const PORT = process.env.PORT || 5000;

// ─── Start Server ──────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // Step 1: MongoDB Atlas se connect karo
    await connectDB();

    // Step 2: Ek HTTP server create karo (Express ke zaiye)
    const httpServer = createServer(app);

    // Step 3: Socket.IO attach karo HTTP server ke saath
    const io = new Server(httpServer, {
      cors: {
        origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim()),
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    // Step 4: Initialize Proctoring Socket Events
    initializeProctoringSocket(io);

    // Step 5: Attach io instance to app for use in routes
    app.locals.io = io;

    // Step 6: Server start karo
    httpServer.listen(PORT, () => {
      console.log('─────────────────────────────────────────');
      console.log(`🚀 Server running on PORT: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log(`📡 Socket.IO enabled for live proctoring`);
      console.log('─────────────────────────────────────────');
    });

    // ─── Graceful Shutdown ───────────────────────────────────
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      io.close();
      httpServer.close(() => {
        console.log('✅ HTTP & Socket.IO server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
