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
// @desc    Get global leaderboard
// @route   GET /api/users/leaderboard
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
  const currentUserId = req.user?.id;

  // Aggregate test attempts to get user scores and rankings
  const leaderboard = await TestAttempt.aggregate([
    {
      // Group by user and calculate stats
      $group: {
        _id: '$user',
        totalAttempts: { $sum: 1 },
        totalScore: { $sum: '$score' },
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
      },
    },
    {
      // Sort by average score descending
      $sort: { avgScore: -1 },
    },
    {
      $limit: limit,
    },
    {
      // Lookup user details (name, email)
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      // Unwind user details array
      $unwind: '$userDetails',
    },
    {
      // Project clean response
      $project: {
        _id: 0,
        userId: '$_id',
        name: '$userDetails.name',
        email: '$userDetails.email',
        score: { $round: [{ $divide: ['$totalScore', '$totalAttempts'] }, 0] },
        avgScore: { $round: ['$avgScore', 1] },
        maxScore: '$maxScore',
        tests: '$totalAttempts',
      },
    },
    {
      // Calculate rank based on avgScore
      $facet: {
        results: [{ $skip: 0 }, { $limit: limit }],
      },
    },
  ]);

  // Format response with rank numbers
  const results = leaderboard[0]?.results || [];
  const leaderboardWithRanks = results.map((leader: any, index: number) => {
    // Determine badge based on average score
    let badge = 'Rising';
    if (leader.avgScore >= 95) badge = 'Grandmaster';
    else if (leader.avgScore >= 90) badge = 'Master';
    else if (leader.avgScore >= 85) badge = 'Expert';
    else if (leader.avgScore >= 80) badge = 'Advanced';
    else if (leader.avgScore >= 75) badge = 'Proficient';

    return {
      rank: index + 1,
      userId: leader.userId.toString(),
      name: leader.name,
      email: leader.email,
      score: leader.avgScore, // Use avgScore as the display score
      tests: leader.tests,
      badge,
      isCurrentUser: currentUserId === leader.userId.toString(),
    };
  });

  res.status(200).json(
    successResponse('Leaderboard fetched successfully.', {
      totalUsers: await User.countDocuments(),
      leaderboard: leaderboardWithRanks,
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
