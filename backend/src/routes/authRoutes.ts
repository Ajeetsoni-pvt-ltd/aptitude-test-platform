// backend/src/routes/authRoutes.ts
// ─────────────────────────────────────────────────────────────
// Auth Routes: Register + Login + GetMe
// Kyun alag routes file: app.ts clean rahega
// Agar kal auth logic change karna ho — sirf yahi file dekhni hogi
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
// Note: protect middleware Step 4 mein banayenge — tab getMe secure hoga
// import { protect } from '../middlewares/authMiddleware';
import { protect } from '../middlewares/authMiddleware';


const router = Router();

// ─── Public Routes (No token required) ────────────────────────
// POST /api/auth/register → Naya user banao
router.post('/register', register);

// POST /api/auth/login → Login karo, token pao
router.post('/login', login);

// ─── Semi-Private (Step 4 ke baad protect add karenge) ────────
// GET /api/auth/me → Apni profile dekho (token chahiye)
// router.get('/me', protect, getMe);  // ← Step 4 baad uncomment karna
router.get('/me', protect, getMe); // Temporary: Step 4 tak bina protect ke

export default router;
