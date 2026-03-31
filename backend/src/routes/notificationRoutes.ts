import { Router } from 'express';
import { getMyNotifications, markNotificationAsRead, markAllAsRead } from '../controllers/notificationController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

// Protect all notification routes (only logged-in users can access)
router.use(protect);

router.get('/', getMyNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markNotificationAsRead);

export default router;
