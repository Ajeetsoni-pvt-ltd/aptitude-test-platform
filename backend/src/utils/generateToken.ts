// backend/src/utils/generateToken.ts
// ─────────────────────────────────────────────────────────────
// JWT Token Generator Utility
// Uses JWT_EXPIRE from env (default: 7d)
// ─────────────────────────────────────────────────────────────

import jwt, { SignOptions } from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  role: 'student' | 'admin';
}

const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file!');
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
};

export default generateToken;
