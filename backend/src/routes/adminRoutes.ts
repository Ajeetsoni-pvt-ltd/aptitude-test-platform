// backend/src/routes/adminRoutes.ts
// Admin Routes — protect + adminOnly middleware

import { Router } from 'express';
import {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getStudentAnalytics,
  toggleUserStatus,
} from '../controllers/adminController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// All admin routes → login + admin role required
router.use(protect, adminOnly);

// GET  /api/admin/stats
router.get('/stats', getAdminStats);

// GET  /api/admin/users
router.get('/users', getAllUsers);

// PATCH /api/admin/users/:userId/role
router.patch('/users/:userId/role', updateUserRole);

// PATCH /api/admin/users/:userId/status (activate/deactivate)
router.patch('/users/:userId/status', toggleUserStatus);

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', deleteUser);

// GET /api/admin/students/:userId/analytics
router.get('/students/:userId/analytics', getStudentAnalytics);

export default router;