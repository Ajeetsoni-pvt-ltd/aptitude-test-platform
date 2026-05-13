// backend/src/utils/tokenUtils.ts
// ─────────────────────────────────────────────────────────────
// Secure Token Utilities — for email verification & password reset
// Raw tokens are sent via email; SHA-256 hashed versions stored in DB.
// Even if DB is compromised, tokens can't be used directly.
// ─────────────────────────────────────────────────────────────

import crypto from 'crypto';

/**
 * Generate a cryptographically secure verification/reset token.
 * Returns both the raw token (for email) and the hashed token (for DB).
 */
export const generateSecureToken = (): { rawToken: string; hashedToken: string } => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, hashedToken };
};

/**
 * Hash a raw token for comparison against DB stored hash.
 * Used when verifying a token received from the user.
 */
export const hashToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};
