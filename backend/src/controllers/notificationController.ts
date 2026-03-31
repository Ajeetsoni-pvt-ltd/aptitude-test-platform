import { Request, Response } from 'express';
import Notification from '../models/Notification';
import mongoose from 'mongoose';

// ── Get all notifications for current user ─────────────────────────
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const notifications = await Notification.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate('relatedEntity')
      .sort({ createdAt: -1 })
      .limit(50); // Fetch top 50 recent notifications

    const unreadCount = await Notification.countDocuments({
      user: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Mark a specific notification as read ───────────────────────────
export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: new mongoose.Types.ObjectId(userId!) },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Mark all notifications as read ─────────────────────────────────
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    
    await Notification.updateMany(
      { user: new mongoose.Types.ObjectId(userId!), isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};
