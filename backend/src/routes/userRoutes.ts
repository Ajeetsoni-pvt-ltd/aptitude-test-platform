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

// PUT  /api/users/profile        → Update profile (name, email)
router.put('/profile', updateProfile);

// POST /api/users/profile-picture → Upload profile picture
router.post('/profile-picture', upload.single('profilePicture'), uploadProfilePicture);

export default router;
