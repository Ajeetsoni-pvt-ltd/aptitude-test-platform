import express, { Router } from 'express';
import { chatWithAI, aiHealth } from '../controllers/aiController';

const router: Router = express.Router();

/**
 * AI Routes for Study Assistant
 * All routes are public (no auth required initially)
 * Can be protected with middleware if needed: router.post('/chat', authMiddleware, chatWithAI)
 */

// Chat endpoint - main functionality
router.post('/chat', chatWithAI);

// Health check endpoint
router.get('/health', aiHealth);

export default router;
