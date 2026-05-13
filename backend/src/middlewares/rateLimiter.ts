// backend/src/middlewares/rateLimiter.ts
// ─────────────────────────────────────────────────────────────
// Per-Endpoint Rate Limiters for Auth Routes
// Prevents brute-force, credential stuffing, and abuse
// ─────────────────────────────────────────────────────────────

import rateLimit from 'express-rate-limit';

// ─── Signup Limiter: 5 requests per hour ─────────────────────
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again after 1 hour.',
    data: null,
  },
});

// ─── Login Limiter: 5 attempts per 15 minutes ───────────────
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
    data: null,
  },
});

// ─── Resend Verification Limiter: 3 requests per hour ───────
export const resendVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification email requests. Please try again later.',
    data: null,
  },
});

// ─── Forgot Password Limiter: 3 requests per hour ──────────
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
    data: null,
  },
});
