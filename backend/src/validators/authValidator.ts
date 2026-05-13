// backend/src/validators/authValidator.ts
// ─────────────────────────────────────────────────────────────
// Input Validation Middleware for Auth Endpoints
// Uses manual validation (lightweight, no extra dependencies)
// Returns 422 with field-specific error messages
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/ApiResponse';

// ─── Helper: sanitize string input ─────────────────────────
const sanitizeStr = (val: unknown): string =>
  typeof val === 'string' ? val.trim() : '';

// ─── Helper: validate email format ─────────────────────────
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Helper: validate strong password ──────────────────────
// Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
const isStrongPassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    return 'Password must contain at least one special character.';
  return null;
};

// ═══════════════════════════════════════════════════════════════
// VALIDATOR: Signup
// ═══════════════════════════════════════════════════════════════
export const validateSignup = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const name = sanitizeStr(req.body.name);
  const email = sanitizeStr(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const collegeName = sanitizeStr(req.body.collegeName);
  const branch = sanitizeStr(req.body.branch);
  const section = sanitizeStr(req.body.section);

  const errors: string[] = [];

  if (!name || name.length < 2 || name.length > 50) {
    errors.push('Name must be between 2 and 50 characters.');
  }
  if (!email || !isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  }
  if (!password) {
    errors.push('Password is required.');
  } else {
    const pwError = isStrongPassword(password);
    if (pwError) errors.push(pwError);
  }
  if (!collegeName || collegeName.length < 2) {
    errors.push('College name is required (min 2 characters).');
  }
  if (!branch || branch.length < 2) {
    errors.push('Branch is required (min 2 characters).');
  }
  if (!section) {
    errors.push('Section is required.');
  }

  if (errors.length > 0) {
    res.status(422).json(errorResponse(errors[0]));
    return;
  }

  // Sanitize into body for controller
  req.body.name = name;
  req.body.email = email;
  req.body.collegeName = collegeName;
  req.body.branch = branch;
  req.body.section = section;

  next();
};

// ═══════════════════════════════════════════════════════════════
// VALIDATOR: Login
// ═══════════════════════════════════════════════════════════════
export const validateLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const email = sanitizeStr(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !isValidEmail(email)) {
    res.status(422).json(errorResponse('Please provide a valid email address.'));
    return;
  }
  if (!password) {
    res.status(422).json(errorResponse('Password is required.'));
    return;
  }

  req.body.email = email;
  next();
};

// ═══════════════════════════════════════════════════════════════
// VALIDATOR: Resend Verification
// ═══════════════════════════════════════════════════════════════
export const validateResendVerification = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const email = sanitizeStr(req.body.email).toLowerCase();

  if (!email || !isValidEmail(email)) {
    res.status(422).json(errorResponse('Please provide a valid email address.'));
    return;
  }

  req.body.email = email;
  next();
};

// ═══════════════════════════════════════════════════════════════
// VALIDATOR: Forgot Password
// ═══════════════════════════════════════════════════════════════
export const validateForgotPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const email = sanitizeStr(req.body.email).toLowerCase();

  if (!email || !isValidEmail(email)) {
    res.status(422).json(errorResponse('Please provide a valid email address.'));
    return;
  }

  req.body.email = email;
  next();
};

// ═══════════════════════════════════════════════════════════════
// VALIDATOR: Reset Password
// ═══════════════════════════════════════════════════════════════
export const validateResetPassword = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = sanitizeStr(req.body.token);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!token) {
    res.status(422).json(errorResponse('Reset token is required.'));
    return;
  }
  if (!password) {
    res.status(422).json(errorResponse('New password is required.'));
    return;
  }

  const pwError = isStrongPassword(password);
  if (pwError) {
    res.status(422).json(errorResponse(pwError));
    return;
  }

  req.body.token = token;
  next();
};
