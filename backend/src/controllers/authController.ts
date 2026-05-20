// backend/src/controllers/authController.ts
// ─────────────────────────────────────────────────────────────
// Auth Controller — Signup, Login, Email Verification,
// Resend Verification, Forgot Password, Reset Password
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import generateToken from '../utils/generateToken';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import { generateSecureToken, hashToken } from '../utils/tokenUtils';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

// ─── Constants ─────────────────────────────────────────────
const TOKEN_EXPIRY_MINUTES = 30;
const BCRYPT_SALT_ROUNDS = 12;

// ─── Helpers ───────────────────────────────────────────────
const logAuthDebug = (context: string, payload: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'test') return;
  console.info(`[auth:${context}]`, payload);
};

// ═══════════════════════════════════════════════════════════════
// 1. SIGNUP (Register)
// POST /api/auth/signup
// Creates user with isVerified=false, sends verification email
// Does NOT issue JWT
// ═══════════════════════════════════════════════════════════════
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, collegeName, branch, section, role } = req.body;

  logAuthDebug('signup-request', {
    email,
    hasName: Boolean(name),
    hasPassword: Boolean(password),
  });

  // Check for duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Generic message to prevent email enumeration
    res.status(400).json(
      errorResponse('An account with this email already exists.')
    );
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  // Generate verification token (raw for email, hashed for DB)
  const { rawToken, hashedToken } = generateSecureToken();
  const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Create user (unverified)
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    collegeName,
    branch,
    section,
    role: role === 'admin' ? 'admin' : 'student',
    isVerified: false,
    verificationToken: hashedToken,
    verificationTokenExpiry: tokenExpiry,
  });

  // Send verification email (non-blocking — don't fail signup if email fails)
  const emailSent = await sendVerificationEmail(user.email, user.name, rawToken);

  if (!emailSent) {
    console.error('[auth:signup-email-failed]', { email: user.email });
  }

  logAuthDebug('signup-success', { email: user.email, emailSent });

  // Do NOT issue JWT — user must verify email first
  res.status(201).json(
    successResponse('Registration successful! Please check your email to verify your account.')
  );
});

// ═══════════════════════════════════════════════════════════════
// 2. VERIFY EMAIL
// GET /api/auth/verify-email?token=xxx
// Validates token, marks user as verified
// ═══════════════════════════════════════════════════════════════
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const rawToken = req.query.token as string;

  if (!rawToken) {
    res.status(400).json(errorResponse('Verification token is required.'));
    return;
  }

  // Hash the incoming token to compare with DB
  const hashedToken = hashToken(rawToken);

  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationTokenExpiry: { $gt: new Date() },
  }).select('+verificationToken +verificationTokenExpiry');

  if (!user) {
    // Check if there's a user with this token but expired
    const expiredUser = await User.findOne({
      verificationToken: hashedToken,
    }).select('+verificationToken');

    if (expiredUser) {
      res.status(400).json(
        errorResponse('Verification link has expired. Please request a new one.')
      );
      return;
    }

    res.status(400).json(
      errorResponse('Invalid verification token.')
    );
    return;
  }

  // Already verified (edge case: double-click)
  if (user.isVerified) {
    res.status(200).json(
      successResponse('Email is already verified. You can login now.')
    );
    return;
  }

  // Mark as verified and clear token fields
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  logAuthDebug('verify-email-success', { email: user.email });

  res.status(200).json(
    successResponse('Email verified successfully! You can now login.')
  );
});

// ═══════════════════════════════════════════════════════════════
// 3. RESEND VERIFICATION EMAIL
// POST /api/auth/resend-verification
// Generates new token, sends fresh email
// ═══════════════════════════════════════════════════════════════
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Generic response to prevent email enumeration
  const genericMessage = 'If an unverified account exists with this email, a verification link has been sent.';

  const user = await User.findOne({ email });

  // Don't reveal if user exists or not
  if (!user) {
    res.status(200).json(successResponse(genericMessage));
    return;
  }

  // Already verified
  if (user.isVerified) {
    res.status(200).json(successResponse(genericMessage));
    return;
  }

  // Generate new token
  const { rawToken, hashedToken } = generateSecureToken();
  const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  // Update user with new token (replaces old one)
  user.verificationToken = hashedToken;
  user.verificationTokenExpiry = tokenExpiry;
  await user.save();

  // Send email
  await sendVerificationEmail(user.email, user.name, rawToken);

  logAuthDebug('resend-verification', { email: user.email });

  res.status(200).json(successResponse(genericMessage));
});

// ═══════════════════════════════════════════════════════════════
// 4. LOGIN
// POST /api/auth/login
// Blocks unverified users (403), only verified users get JWT
// ═══════════════════════════════════════════════════════════════
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  logAuthDebug('login-request', { email, hasPassword: Boolean(password) });

  if (!email || !password) {
    res.status(400).json(errorResponse('Email and password are required.'));
    return;
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401).json(errorResponse('Invalid email or password.'));
    return;
  }

  if (!user.password) {
    console.warn('[auth:login-missing-password-hash]', {
      email,
      userId: user._id.toString(),
    });
    res.status(401).json(errorResponse('Invalid email or password.'));
    return;
  }

  // Detect plain-text password in DB (migration needed)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
  if (!isBcryptHash) {
    console.error('[auth:login-plain-text-password-detected]', {
      email,
      userId: user._id.toString(),
      hint: 'Run: npx ts-node src/utils/rehashPasswords.ts to fix this',
    });
    res.status(401).json(
      errorResponse('Account password format outdated. Please contact admin to reset your password.')
    );
    return;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    console.warn('[auth:login-password-mismatch]', {
      email,
      userId: user._id.toString(),
    });
    res.status(401).json(errorResponse('Invalid email or password.'));
    return;
  }

  // ─── EMAIL VERIFICATION GATE ─────────────────────────────
  if (!user.isVerified) {
    res.status(403).json(
      errorResponse('Please verify your email before logging in. Check your inbox for the verification link.')
    );
    return;
  }

  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
  });

  res.status(200).json(
    successResponse('Login successful! Welcome back.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        branch: user.branch,
        section: user.section,
        role: user.role,
        isVerified: user.isVerified,
        profilePicture: user.profilePicture,
      },
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// 5. FORGOT PASSWORD
// POST /api/auth/forgot-password
// Sends password reset email (generic response — anti-enumeration)
// ═══════════════════════════════════════════════════════════════
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  // Always return same message to prevent email enumeration
  const genericMessage = 'If an account exists with this email, a password reset link has been sent.';

  const user = await User.findOne({ email });

  if (!user) {
    res.status(200).json(successResponse(genericMessage));
    return;
  }

  // Generate reset token
  const { rawToken, hashedToken } = generateSecureToken();
  const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiry = tokenExpiry;
  await user.save();

  // Send email
  await sendPasswordResetEmail(user.email, user.name, rawToken);

  logAuthDebug('forgot-password', { email: user.email });

  res.status(200).json(successResponse(genericMessage));
});

// ═══════════════════════════════════════════════════════════════
// 6. RESET PASSWORD
// POST /api/auth/reset-password
// Validates token, sets new password
// ═══════════════════════════════════════════════════════════════
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  if (!token) {
    res.status(400).json(errorResponse('Reset token is required.'));
    return;
  }

  // Hash the incoming token to compare with DB
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpiry');

  if (!user) {
    res.status(400).json(
      errorResponse('Invalid or expired reset token. Please request a new password reset.')
    );
    return;
  }

  // Hash new password and save
  user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;

  // Also verify email if not already (user proved email ownership)
  if (!user.isVerified) {
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
  }

  await user.save();

  logAuthDebug('reset-password-success', { email: user.email });

  res.status(200).json(
    successResponse('Password reset successful! You can now login with your new password.')
  );
});

// ═══════════════════════════════════════════════════════════════
// 7. GET ME (unchanged)
// GET /api/auth/me
// Returns current authenticated user's profile
// ═══════════════════════════════════════════════════════════════
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json(errorResponse('User not found.'));
    return;
  }

  res.status(200).json(
    successResponse('User profile fetched successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      section: user.section,
      role: user.role,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    })
  );
});
