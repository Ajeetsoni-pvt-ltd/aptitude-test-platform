// backend/src/utils/generateToken.ts
// ─────────────────────────────────────────────────────────────
// JWT Token Generator Utility
// Kyun alag file: Register + Login dono mein token chahiye
// DRY principle: ek baar likho, har jagah use karo
// ─────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

// Token generate karne ke liye user ki minimum info chahiye
interface TokenPayload {
  id: string;               // MongoDB _id
  role: 'student' | 'admin'; // User ka role
}

const generateToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;

  // Guard: JWT_SECRET .env mein hona ZAROORI hai
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in .env file!');
  }

  // jwt.sign(payload, secret, options)
  // payload → token ke andar store hoga (user id + role)
  // secret  → server ka private key — kisi ko pata nahi hona chahiye
  // expiresIn → token kitne time mein expire hoga (7 days)
  return jwt.sign(payload, secret, {
    expiresIn: '7d', // 7 din baad dobara login karna padega
  });
};

export default generateToken;
