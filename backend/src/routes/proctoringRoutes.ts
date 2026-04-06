// backend/src/routes/proctoringRoutes.ts
import { Router } from 'express';
import {
  logViolation,
  getActiveProctoredTests,
  getViolationLog,
  getFlaggedTests,
} from '../controllers/proctoringController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();
router.use(protect);

// Student routes (during test)
router.post('/:attemptId/violations', logViolation);

// Admin routes
router.get('/active',                   adminOnly, getActiveProctoredTests);
router.get('/flagged',                  adminOnly, getFlaggedTests);
router.get('/:attemptId/violations',    adminOnly, getViolationLog);

export default router;
