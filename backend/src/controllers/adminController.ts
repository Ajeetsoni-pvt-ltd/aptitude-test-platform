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

// ═══════════════════════════════════════════════════════════════
// @desc    Deep analytics for admin analytics page
// @route   GET /api/admin/analytics
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const getAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  const [
    totalStudents,
    totalAttempts,
    totalQuestions,
    avgScoreResult,
    // Score distribution buckets
    scoreDistribution,
    // Daily attempts for last 30 days
    dailyActivity,
    // Per-topic performance
    topicPerformance,
    // Top 10 students by avg score
    topStudents,
    // Difficulty-wise avg score
    difficultyPerformance,
    // Recent 7-day vs previous 7-day comparison
    last7Attempts,
    prev7Attempts,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    TestAttempt.countDocuments(),
    Question.countDocuments(),

    TestAttempt.aggregate([
      { $group: { _id: null, avg: { $avg: '$score' }, total: { $sum: 1 } } },
    ]),

    // Score buckets: 0-20, 21-40, 41-60, 61-80, 81-100
    TestAttempt.aggregate([
      {
        $bucket: {
          groupBy: '$score',
          boundaries: [0, 21, 41, 61, 81, 101],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]),

    // Daily attempts last 30 days
    TestAttempt.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          attempts: { $sum: 1 },
          avgScore: { $avg: '$score' },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Topic performance across all attempts
    TestAttempt.aggregate([
      { $match: { topicPerformance: { $exists: true } } },
      { $project: { topicPerformance: { $objectToArray: '$topicPerformance' } } },
      { $unwind: '$topicPerformance' },
      {
        $group: {
          _id: '$topicPerformance.k',
          totalCorrect: { $sum: '$topicPerformance.v.correct' },
          totalQuestions: { $sum: '$topicPerformance.v.total' },
        },
      },
      {
        $project: {
          topic: '$_id',
          totalCorrect: 1,
          totalQuestions: 1,
          accuracy: {
            $cond: [
              { $gt: ['$totalQuestions', 0] },
              { $round: [{ $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      { $sort: { accuracy: -1 } },
    ]),

    // Top 10 students
    TestAttempt.aggregate([
      { $group: { _id: '$user', avgScore: { $avg: '$score' }, tests: { $sum: 1 }, bestScore: { $max: '$score' } } },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          name: '$user.name',
          email: '$user.email',
          avgScore: { $round: ['$avgScore', 1] },
          tests: 1,
          bestScore: 1,
        },
      },
    ]),

    // Difficulty-wise avg score
    TestAttempt.aggregate([
      { $unwind: '$answers' },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.question',
          foreignField: '_id',
          as: 'questionData',
        },
      },
      { $unwind: '$questionData' },
      {
        $group: {
          _id: '$questionData.difficulty',
          correct: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
          total: { $sum: 1 },
        },
      },
      {
        $project: {
          difficulty: '$_id',
          accuracy: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$correct', '$total'] }, 100] }, 1] },
              0,
            ],
          },
          total: 1,
        },
      },
    ]),

    TestAttempt.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    TestAttempt.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        $lt: sevenDaysAgo,
      },
    }),
  ]);

  const avgScore = avgScoreResult[0]?.avg ? Math.round(avgScoreResult[0].avg) : 0;

  // Fill missing days in daily activity
  const activityMap = new Map(dailyActivity.map((d: { _id: string; attempts: number; avgScore: number }) => [d._id, d]));
  const filledActivity = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key  = date.toISOString().split('T')[0];
    const entry = activityMap.get(key) as { _id: string; attempts: number; avgScore: number } | undefined;
    filledActivity.push({
      date: key,
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      attempts: entry?.attempts ?? 0,
      avgScore: entry?.avgScore ? Math.round(entry.avgScore) : 0,
    });
  }

  // Score distribution labels
  const bucketLabels = ['0–20', '21–40', '41–60', '61–80', '81–100'];
  const formattedDistribution = scoreDistribution.map((b: { _id: number | string; count: number }, i: number) => ({
    range: bucketLabels[i] ?? String(b._id),
    count: b.count,
  }));

  const growthRate = prev7Attempts > 0
    ? Math.round(((last7Attempts - prev7Attempts) / prev7Attempts) * 100)
    : last7Attempts > 0 ? 100 : 0;

  res.status(200).json(
    successResponse('Analytics fetched successfully.', {
      overview: {
        totalStudents,
        totalAttempts,
        totalQuestions,
        avgScore,
        last7DaysAttempts: last7Attempts,
        growthRate,
      },
      scoreDistribution: formattedDistribution,
      dailyActivity: filledActivity,
      topicPerformance,
      topStudents,
      difficultyPerformance,
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get per-student analytics
// @route   GET /api/admin/students/:userId/analytics
// @access  Admin only
// ═══════════════════════════════════════════════════════════════
export const getStudentAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('-password').lean();
  if (!user) {
    res.status(404).json(errorResponse('Student not found.'));
    return;
  }

  const attempts = await TestAttempt.find({ user: userId })
    .sort({ createdAt: 1 })
    .lean();

  const totalAttempts = attempts.length;
  const avgScore = totalAttempts
    ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / totalAttempts)
    : 0;
  const bestScore = totalAttempts ? Math.max(...attempts.map((a) => a.score)) : 0;
  const totalTime = attempts.reduce((s, a) => s + (a.totalTime || 0), 0);

  // Topic performance aggregation
  const topicMap: Record<string, { correct: number; total: number }> = {};
  for (const attempt of attempts) {
    if (attempt.topicPerformance) {
      const tp = attempt.topicPerformance as unknown as Map<string, { correct: number; total: number }>;
      const entries = tp instanceof Map ? Array.from(tp.entries()) : Object.entries(tp);
      for (const [topic, data] of entries) {
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        const performanceData = data as { correct?: number; total?: number };
        topicMap[topic].correct += performanceData.correct || 0;
        topicMap[topic].total   += performanceData.total   || 0;
      }
    }
  }

  const topicPerformance = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    correct: data.correct,
    total: data.total,
    accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const scoreTrend = attempts.map((a) => ({
    date: a.createdAt,
    score: a.score,
    title: a.title,
  }));

  const recentAttempts = [...attempts].reverse().slice(0, 10).map((a) => ({
    _id: a._id,
    title: a.title,
    score: a.score,
    correctCount: a.correctCount,
    incorrectCount: a.incorrectCount,
    skippedCount: a.skippedCount,
    totalTime: a.totalTime,
    createdAt: a.createdAt,
  }));

  res.status(200).json(
    successResponse('Student analytics fetched.', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: true,
        createdAt: user.createdAt,
      },
      stats: {
        totalAttempts,
        avgScore,
        bestScore,
        totalTime,
        totalViolations: 0,
      },
      topicPerformance,
      scoreTrend,
      recentAttempts,
    })
  );
});