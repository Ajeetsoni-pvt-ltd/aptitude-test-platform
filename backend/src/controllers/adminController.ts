// backend/src/controllers/adminController.ts
// ─────────────────────────────────────────────────────────────
// Admin Controller — Platform-wide stats + User management
// Sirf admin role wale access kar sakte hain
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import User        from '../models/User';
import Question    from '../models/Question';
import TestAttempt from '../models/TestAttempt';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// ═══════════════════════════════════════════════════════════════
// @desc    Platform-wide stats for admin dashboard
// @route   GET /api/admin/stats
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const getAdminStats = asyncHandler(
  async (_req: Request, res: Response) => {

    // ─── Parallel mein sab kuch fetch karo (fast!) ────────────
    const [
      totalUsers,
      totalStudents,
      totalAdmins,
      totalQuestions,
      totalAttempts,
      // Topic-wise question count
      topicStats,
      // Difficulty-wise question count
      difficultyStats,
      // Recent attempts (last 7 days)
      recentAttempts,
      // Average score across all attempts
      avgScoreResult,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      Question.countDocuments(),
      TestAttempt.countDocuments(),

      // MongoDB Aggregation — topic-wise count [web:234]
      Question.aggregate([
        { $group: { _id: '$topic', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Difficulty-wise count
      Question.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),

      // Last 7 din ke attempts
      TestAttempt.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),

      // Average score
      TestAttempt.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$score' } } },
      ]),
    ]);

    // Average score format karo
    const avgScore = avgScoreResult.length > 0
      ? Math.round(avgScoreResult[0].avgScore)
      : 0;

    res.status(200).json(
      successResponse('Admin stats mil gayi!', {
        users: {
          total: totalUsers,
          students: totalStudents,
          admins: totalAdmins,
        },
        questions: {
          total: totalQuestions,
          byTopic: topicStats,        // [{ _id: 'Quant', count: 10 }, ...]
          byDifficulty: difficultyStats, // [{ _id: 'easy', count: 8 }, ...]
        },
        tests: {
          total: totalAttempts,
          last7Days: recentAttempts,
          avgScore,
        },
      })
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Get all users (with pagination)
// @route   GET /api/admin/users
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const getAllUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(1000, parseInt(req.query.limit as string) || 10);
    const skip  = (page - 1) * limit;

    // Search by name/email
    const search = req.query.search as string;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select('-password') // Password kabhi nahi bhejte!
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json(
      successResponse('Saare users mil gaye!', {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalUsers: totalCount,
        },
      })
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Change user role (student ↔ admin)
// @route   PATCH /api/admin/users/:userId/role
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const updateUserRole = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { role }   = req.body;

    if (!['student', 'admin'].includes(role)) {
      res.status(400).json(errorResponse('Role sirf "student" ya "admin" ho sakta hai.'));
      return;
    }

    // Apna aap ka role change na kar sake
    if (userId === req.user!.id) {
      res.status(400).json(errorResponse('Tum apna khud ka role change nahi kar sakte!'));
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, select: '-password' }
    );

    if (!user) {
      res.status(404).json(errorResponse('User nahi mila.'));
      return;
    }

    res.status(200).json(
      successResponse(`User ka role "${role}" kar diya gaya!`, user)
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Delete a user
// @route   DELETE /api/admin/users/:userId
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const deleteUser = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (userId === req.user!.id) {
      res.status(400).json(errorResponse('Tum apna khud ka account delete nahi kar sakte!'));
      return;
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      res.status(404).json(errorResponse('User nahi mila.'));
      return;
    }

    // User ke attempts bhi delete karo
    await TestAttempt.deleteMany({ user: userId });

    res.status(200).json(
      successResponse('User aur uske saare attempts delete ho gaye!', null)
    );
  }
);