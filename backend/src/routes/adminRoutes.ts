// backend/src/routes/adminRoutes.ts
// ─────────────────────────────────────────────────────────────
// Admin Routes — Sab ke liye protect + adminOnly middleware
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/adminController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// Sab admin routes → login + admin role required
router.use(protect, adminOnly);

// GET  /api/admin/stats              → Platform stats
router.get('/stats', getAdminStats);

// GET  /api/admin/users              → All users list
router.get('/users', getAllUsers);

// PATCH /api/admin/users/:userId/role → Role change
router.patch('/users/:userId/role', updateUserRole);

// DELETE /api/admin/users/:userId    → User delete
router.delete('/users/:userId', deleteUser);

export default router;