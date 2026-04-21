// backend/src/controllers/userController.ts
// ─────────────────────────────────────────────────────────────
// User Controller: Profile operations
// getProfile       → GET /api/users/profile
// updateProfile    → PUT /api/users/profile
// uploadProfilePic → POST /api/users/profile-picture
// getStats         → GET /api/users/stats
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import User from '../models/User';
import TestAttempt from '../models/TestAttempt';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// ═══════════════════════════════════════════════════════════════
// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json(errorResponse('User ID not found. Login required.'));
    return;
  }

  const user = await User.findById(userId).select('-password');

  if (!user) {
    res.status(404).json(errorResponse('User not found.'));
    return;
  }

  res.status(200).json(
    successResponse('Profile fetched successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get user's test statistics
// @route   GET /api/users/stats
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json(errorResponse('User ID not found. Login required.'));
    return;
  }

  // Fetch all test attempts for this user
  const attempts = await TestAttempt.find({ user: userId });

  // Calculate stats
  const totalTests = attempts.length;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map(a => a.score))
    : 0;
  const totalTime = attempts.reduce((sum, a) => sum + (a.totalTime || 0), 0);
  
  // Average score
  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  // Rank (simple: based on average score)
  // In production, implement proper ranking algorithm
  const allUsersStats = await TestAttempt.aggregate([
    {
      $group: {
        _id: '$user',
        avgScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 },
      },
    },
    {
      $sort: { avgScore: -1 },
    },
  ]);

  const userRank = allUsersStats.findIndex(
    (stat) => stat._id.toString() === userId
  ) + 1;

  res.status(200).json(
    successResponse('Stats fetched successfully.', {
      totalTests,
      bestScore: bestScore || 0,
      averageScore: avgScore,
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      rank: userRank,
      recentAttempts: attempts.slice(-5).reverse(), // Last 5 attempts
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Update user profile (name, email)
// @route   PUT /api/users/profile
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { name, email } = req.body;

  if (!userId) {
    res.status(401).json(errorResponse('User ID not found. Login required.'));
    return;
  }

  // Validation
  if (name && name.length < 2) {
    res.status(400).json(errorResponse('Name must be at least 2 characters long.'));
    return;
  }

  // Check if email already exists (if being updated)
  if (email) {
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: userId },
    });
    if (existingUser) {
      res.status(400).json(errorResponse('Email already in use.'));
      return;
    }
  }

  // Update user
  const updateData: Record<string, string> = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email.toLowerCase();

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) {
    res.status(404).json(errorResponse('User not found.'));
    return;
  }

  res.status(200).json(
    successResponse('Profile updated successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const uploadProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json(errorResponse('User ID not found. Login required.'));
    return;
  }

  if (!req.file) {
    res.status(400).json(errorResponse('No image file provided.'));
    return;
  }

  // Validate file type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(req.file.mimetype)) {
    res.status(400).json(errorResponse('Only JPG, PNG, WebP, and GIF images are allowed.'));
    return;
  }

  // Validate file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (req.file.size > MAX_SIZE) {
    res.status(400).json(errorResponse('File size must not exceed 5MB.'));
    return;
  }

  // Create file path (using timestamp for uniqueness)
  const timestamp = Date.now();
  const fileExt = req.file.mimetype.split('/')[1];
  const filename = `profile-${userId}-${timestamp}.${fileExt}`;
  const filepath = `uploads/profiles/${filename}`;

  // In production, use cloud storage (AWS S3, Cloudinary, etc.)
  // For now, store filename in DB
  const user = await User.findByIdAndUpdate(
    userId,
    { profilePicture: filepath },
    { new: true }
  ).select('-password');

  if (!user) {
    res.status(404).json(errorResponse('User not found.'));
    return;
  }

  res.status(200).json(
    successResponse('Profile picture uploaded successfully.', {
      profilePicture: user.profilePicture,
      message: 'Image processed and saved.',
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get global leaderboard (top performers by avg score)
// @route   GET /api/users/leaderboard?limit=50
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const currentUserId = req.user?.id;

  // Aggregate: group by user, compute avg score + test count
  const leaderboardRaw = await TestAttempt.aggregate([
    {
      $group: {
        _id: '$user',
        avgScore: { $avg: '$score' },
        totalTests: { $sum: 1 },
        bestScore: { $max: '$score' },
      },
    },
    { $sort: { avgScore: -1, totalTests: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$userInfo.name',
        email: '$userInfo.email',
        avgScore: { $round: ['$avgScore', 1] },
        totalTests: 1,
        bestScore: 1,
      },
    },
  ]);

  const getBadge = (avgScore: number, tests: number): string => {
    if (avgScore >= 90 && tests >= 5) return 'Neural Master';
    if (avgScore >= 80) return 'Elite';
    if (avgScore >= 70) return 'Advanced';
    if (avgScore >= 60) return 'Proficient';
    if (avgScore >= 50) return 'Intermediate';
    return 'Beginner';
  };

  const leaderboard = leaderboardRaw.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId.toString(),
    name: entry.name,
    email: entry.email,
    score: entry.avgScore,
    tests: entry.totalTests,
    badge: getBadge(entry.avgScore, entry.totalTests),
    isCurrentUser: currentUserId ? entry.userId.toString() === currentUserId : false,
  }));

  console.info('[users:leaderboard]', {
    totalEntries: leaderboard.length,
    requestedLimit: limit,
  });

  res.status(200).json(
    successResponse('Leaderboard fetched successfully.', {
      totalUsers: leaderboard.length,
      leaderboard,
    })
  );
});

export default {
  getProfile,
  getStats,
  updateProfile,
  uploadProfilePicture,
  getLeaderboard,
};
