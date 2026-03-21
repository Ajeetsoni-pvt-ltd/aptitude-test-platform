// backend/src/routes/uploadRoutes.ts
// ─────────────────────────────────────────────────────────────
// Upload Routes — Admin only
// multer middleware → file receive karo → controller ko do
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import { uploadQuestions, getUploadTemplate } from '../controllers/uploadController';
import { protect, adminOnly } from '../middlewares/authMiddleware';
import upload from '../config/multer';

const router = Router();

// Sab upload routes → Admin only
router.use(protect, adminOnly);

// GET  /api/upload/template → Word file format instructions
router.get('/template', getUploadTemplate);

// POST /api/upload/questions → .docx file upload + parse + bulk save
// upload.single('file') → multer middleware
// 'file' → Postman mein form-data ka key name yahi hoga
router.post('/questions', upload.single('file'), uploadQuestions);

export default router;
