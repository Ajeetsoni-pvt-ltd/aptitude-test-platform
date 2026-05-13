// backend/src/routes/authRoutes.ts
// ─────────────────────────────────────────────────────────────
// Auth Routes — Signup, Login, Email Verification, Password Reset
// Each route has its own rate limiter + input validator
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';
import {
  validateSignup,
  validateLogin,
  validateResendVerification,
  validateForgotPassword,
  validateResetPassword,
} from '../validators/authValidator';
import {
  signupLimiter,
  loginLimiter,
  resendVerificationLimiter,
  forgotPasswordLimiter,
} from '../middlewares/rateLimiter';

const router = Router();

// ─── Public Routes (No token required) ────────────────────────

// POST /api/auth/signup → Register new user + send verification email
router.post('/signup', signupLimiter, validateSignup, register);

// POST /api/auth/login → Login (only verified users get JWT)
router.post('/login', loginLimiter, validateLogin, login);

// GET /api/auth/verify-email?token=xxx → Verify email address
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification → Resend verification email
router.post('/resend-verification', resendVerificationLimiter, validateResendVerification, resendVerification);

// POST /api/auth/forgot-password → Request password reset email
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);

// POST /api/auth/reset-password → Reset password with token
router.post('/reset-password', validateResetPassword, resetPassword);

// ─── Protected Routes (Token required) ────────────────────────

// GET /api/auth/me → Get current user profile
router.get('/me', protect, getMe);

export default router;
