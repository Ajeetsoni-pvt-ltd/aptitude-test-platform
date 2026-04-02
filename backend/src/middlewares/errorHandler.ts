// backend/src/middlewares/errorHandler.ts
// ─────────────────────────────────────────────────────────────
// Global Error Handler Middleware
// Kyun: Har type ke error ka alag-alag meaningful message dena
// MongoDB errors, JWT errors, Validation errors — sab yahan handle honge
// app.ts mein is function ko import karke use karenge
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Custom Error Interface: additional fields ke liye
interface AppError extends Error {
  statusCode?: number;  // HTTP status code (400, 401, 404, 500)
  code?: number;        // MongoDB error code (11000 = duplicate)
  kind?: string;        // Mongoose error kind ('ObjectId' etc.)
}

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ─── MongoDB: Duplicate Field Error ───────────────────────
  // Example: Same email se register karo toh yeh error aata hai
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Yeh email already registered hai. Koi aur email use karo.';
  }

  // ─── Mongoose: Invalid ObjectId Format ────────────────────
  // Example: /api/users/invalid-id → MongoDB ObjectId format galat
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Invalid ID format provided.';
  }

  // ─── JWT: Token Expired ────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expire ho gayi. Dobara login karo.';
  }

  // ─── JWT: Invalid Token ────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Access denied.';
  }

  // ─── Mongoose: Validation Error ───────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed: ' + err.message;
  }

  if (err.name === 'MulterError') {
    const multerError = err as unknown as multer.MulterError;
    statusCode = 400;
    message =
      multerError.code === 'LIMIT_FILE_SIZE'
        ? 'Uploaded file is too large.'
        : multerError.message;
  }

  // ─── Send Error Response ───────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace sirf development mein dikhao — production mein nahi
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
