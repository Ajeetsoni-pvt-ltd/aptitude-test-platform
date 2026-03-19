// backend/src/routes/questionRoutes.ts
// ─────────────────────────────────────────────────────────────
// Question Routes
// Public  → GET  (students padh sakte hain)
// Private → POST, PUT, DELETE (sirf admin)
//
// Middleware chain:
//   protect   → Token verify karo, req.user set karo
//   adminOnly → Sirf admin role allow karo
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController';
import { protect, adminOnly } from '../middlewares/authMiddleware';

const router = Router();

// ─── Route Definitions ─────────────────────────────────────────

// POST   /api/questions        → Naya question banao (Admin only)
router.post('/', protect, adminOnly, createQuestion);

// GET    /api/questions        → Sab questions dekho (Public)
router.get('/', getAllQuestions);

// GET    /api/questions/:id    → Ek question dekho (Public)
router.get('/:id', getQuestionById);

// PUT    /api/questions/:id    → Question update karo (Admin only)
router.put('/:id', protect, adminOnly, updateQuestion);

// DELETE /api/questions/:id    → Question delete karo (Admin only)
router.delete('/:id', protect, adminOnly, deleteQuestion);

export default router;
