// backend/src/routes/aiRoutes.ts
import { Router } from 'express';
import { chatWithAI } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// All AI routes require login
router.use(protect);

// POST /api/ai/chat
router.post('/chat', chatWithAI);

export default router;
