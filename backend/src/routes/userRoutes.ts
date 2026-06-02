// backend/src/routes/userRoutes.ts
// ─────────────────────────────────────────────────────────────
// User Routes: Profile operations, stats, picture upload
// ─────────────────────────────────────────────────────────────

import { Router } from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  getStats,
  getLeaderboard,
} from '../controllers/userController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store in memory temporarily
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// All routes require authentication
router.use(protect);

// GET  /api/users/profile        → Get current user's profile
router.get('/profile', getProfile);

// GET  /api/users/stats          → Get user's test statistics
router.get('/stats', getStats);

// GET  /api/users/leaderboard    → Global leaderboard (top performers)
router.get('/leaderboard', getLeaderboard);

// PUT  /api/users/profile        → Update profile (name, email)
router.put('/profile', updateProfile);

// POST /api/users/profile-picture → Upload profile picture
// Wrap multer in error handler to return clear 400 instead of generic 500
router.post('/profile-picture', (req, res, next) => {
  upload.single('profilePicture')(req, res, (err) => {
    if (err) {
      const message = err instanceof multer.MulterError
        ? err.code === 'LIMIT_FILE_SIZE'
          ? 'File size must not exceed 5MB.'
          : `Upload error: ${err.message}`
        : err.message || 'File upload failed.';
      console.error('[multer:error]', { code: (err as any).code, message: err.message });
      return res.status(400).json({ success: false, message, data: null });
    }
    next();
  });
}, uploadProfilePicture);

export default router;
