// backend/src/routes/testRoutes.ts
// ─────────────────────────────────────────────────────────────
// Test Routes — Sab private (login required)
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import {
  startTest,
  submitTest,
  getMyResults,
  getAttemptById,
} from '../controllers/testController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Sab test routes ke liye login zaroori hai → protect sab pe
router.use(protect); // ← Ek baar lagao, sab routes pe apply hoga!

// POST /api/tests/start              → Naya test shuru karo
router.post('/start', startTest);

// POST /api/tests/:attemptId/submit  → Test submit karo
router.post('/:attemptId/submit', submitTest);

// GET  /api/tests/my-results         → Mere saare results
router.get('/my-results', getMyResults);

// GET  /api/tests/:attemptId         → Ek attempt ki poori detail
router.get('/:attemptId', getAttemptById);

export default router;
