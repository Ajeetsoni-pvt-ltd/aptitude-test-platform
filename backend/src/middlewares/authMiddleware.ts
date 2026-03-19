// backend/src/middlewares/authMiddleware.ts
// ─────────────────────────────────────────────────────────────
// JWT Authentication Middleware
// 'protect' → Private routes ke liye guard
// 'adminOnly' → Sirf admin role wale access kar sakein
// ─────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import { errorResponse } from '../utils/ApiResponse';

// ─── JWT Token Payload ka Type ─────────────────────────────────
// jwt.verify() jo object return karta hai uska shape define karo
interface JwtPayload {
  id: string;
  role: 'student' | 'admin';
  iat: number;  // issued at (JWT automatically add karta hai)
  exp: number;  // expiry time (JWT automatically add karta hai)
}

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE 1: protect
// @desc   Verify JWT token — private routes ke liye
// @usage  router.get('/me', protect, getMe)
// ═══════════════════════════════════════════════════════════════
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {

    // ─── Step 1: Token Header mein dhundo ─────────────────────
    // Convention: Authorization: Bearer <token>
    // 'Bearer' = token type (standard practice)
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json(
        errorResponse('Access denied. Token nahi mila. Pehle login karo.')
      );
      return;
    }

    // "Bearer eyJhbGci..." → ["Bearer", "eyJhbGci..."]
    // [1] → sirf token part nikalo
    const token = authHeader.split(' ')[1];

    // ─── Step 2: JWT_SECRET check karo ────────────────────────
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json(errorResponse('Server configuration error.'));
      return;
    }

    // ─── Step 3: Token verify karo ────────────────────────────
    // jwt.verify() → 2 cases:
    //   ✅ Valid token   → decoded payload return karta hai
    //   ❌ Invalid/Expired → Error throw karta hai (errorHandler pakdega)
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // ─── Step 4: User abhi bhi exist karta hai? ───────────────
    // Kyun check: Token valid hai BUT user delete ho gaya ho toh?
    // Example: Admin ne user account delete kiya → token invalidate hona chahiye
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      res.status(401).json(
        errorResponse('Yeh user ab exist nahi karta. Dobara register karo.')
      );
      return;
    }

    // ─── Step 5: req.user set karo ────────────────────────────
    // Ab Controller mein req.user.id ya req.user.role use kar sakte hain
    // types/express.d.ts mein define kiya tha isliye TypeScript happy hai ✅
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    // ─── Step 6: next() → Controller ko pass karo ─────────────
    next();
  }
);

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE 2: adminOnly
// @desc   Sirf 'admin' role wale users allow karo
// @usage  router.post('/questions', protect, adminOnly, createQuestion)
// Note: Hamesha 'protect' ke BAAD use karo — pehle token verify hoga
// ═══════════════════════════════════════════════════════════════
export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // protect middleware pehle run hoga — req.user set hoga tab tak
  if (req.user?.role !== 'admin') {
    res.status(403).json(
      errorResponse('Access denied. Yeh route sirf admins ke liye hai.')
    );
    return;
  }
  // Admin hai → aage jaane do
  next();
};
