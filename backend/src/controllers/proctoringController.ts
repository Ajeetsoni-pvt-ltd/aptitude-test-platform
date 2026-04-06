// backend/src/controllers/proctoringController.ts
// Proctoring Controller — violation logging & admin live view

import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import TestAttempt from '../models/TestAttempt';
import User from '../models/User';

// ─────────────────────────────────────────────────────────────
// @desc    Log a proctoring violation for an attempt
// @route   POST /api/proctoring/:attemptId/violations
// @access  Private (student during test)
// ─────────────────────────────────────────────────────────────
export const logViolation = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { type, details } = req.body;

  const validTypes = ['tab_switch', 'face_missing', 'multiple_faces', 'fullscreen_exit', 'screen_capture', 'copy_paste', 'other'];
  if (!validTypes.includes(type)) {
    res.status(400).json(errorResponse('Invalid violation type.'));
    return;
  }

  const attempt = await TestAttempt.findById(attemptId);
  if (!attempt) {
    res.status(404).json(errorResponse('Test attempt not found.'));
    return;
  }

  if (attempt.user.toString() !== req.user!.id) {
    res.status(403).json(errorResponse('Unauthorized.'));
    return;
  }

  attempt.violations.push({ type, timestamp: new Date(), details });
  await attempt.save();

  res.status(200).json(successResponse('Violation logged.', {
    violationCount: attempt.violations.length,
  }));
});

// ─────────────────────────────────────────────────────────────
// @desc    Get all active tests with proctoring data (admin)
// @route   GET /api/proctoring/active
// @access  Admin only
// ─────────────────────────────────────────────────────────────
export const getActiveProctoredTests = asyncHandler(async (req: Request, res: Response) => {
  // Find tests started in the last 3 hours that are not completed
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const activeAttempts = await TestAttempt.find({
    createdAt: { $gte: threeHoursAgo },
    answers: { $size: 0 }, // Not yet submitted
  })
    .populate('user', 'name email')
    .select('user title totalQuestions createdAt violations proctoringEnabled')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json(successResponse('Active proctored tests.', {
    activeTests: activeAttempts,
    count: activeAttempts.length,
  }));
});

// ─────────────────────────────────────────────────────────────
// @desc    Get violation log for a specific attempt (admin)
// @route   GET /api/proctoring/:attemptId/violations
// @access  Admin only
// ─────────────────────────────────────────────────────────────
export const getViolationLog = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;

  const attempt = await TestAttempt.findById(attemptId)
    .populate('user', 'name email')
    .select('user title violations createdAt score totalQuestions')
    .lean();

  if (!attempt) {
    res.status(404).json(errorResponse('Attempt not found.'));
    return;
  }

  res.status(200).json(successResponse('Violation log fetched.', attempt));
});

// ─────────────────────────────────────────────────────────────
// @desc    Get all tests with violations summary (admin dashboard)
// @route   GET /api/proctoring/flagged
// @access  Admin only
// ─────────────────────────────────────────────────────────────
export const getFlaggedTests = asyncHandler(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const skip  = (page - 1) * limit;

  const [flagged, total] = await Promise.all([
    TestAttempt.find({ 'violations.0': { $exists: true } })
      .populate('user', 'name email')
      .select('user title violations createdAt score totalQuestions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TestAttempt.countDocuments({ 'violations.0': { $exists: true } }),
  ]);

  res.status(200).json(successResponse('Flagged tests fetched.', {
    flaggedTests: flagged,
    pagination: {
      currentPage: page,
      totalPages:  Math.ceil(total / limit),
      total,
    },
  }));
});
