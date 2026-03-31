// backend/src/routes/scheduledTestRoutes.ts
// Routes for admin-managed scheduled tests

import { Router } from 'express';
import {
  createScheduledTest,
  getScheduledTests,
  getMyScheduledTests,
  updateScheduledTest,
  deleteScheduledTest,
  startScheduledTest,
} from '../controllers/scheduledTestController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Student: Get my assigned tests
router.get('/my', getMyScheduledTests);

// Student: Start a scheduled test
router.post('/:id/start', startScheduledTest);

// Admin: Full CRUD
router.get('/',         adminOnly, getScheduledTests);
router.post('/',        adminOnly, createScheduledTest);
router.put('/:id',      adminOnly, updateScheduledTest);
router.delete('/:id',   adminOnly, deleteScheduledTest);

export default router;
