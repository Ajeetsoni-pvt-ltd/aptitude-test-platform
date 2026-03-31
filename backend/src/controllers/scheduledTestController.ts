// backend/src/controllers/scheduledTestController.ts
// CRUD for admin-created scheduled tests

import { Request, Response } from 'express';
import ScheduledTest from '../models/ScheduledTest';
import Notification from '../models/Notification';
import Question from '../models/Question';
import TestAttempt from '../models/TestAttempt';
import mongoose from 'mongoose';

// ── Create a scheduled test ───────────────────────────────────────
export const createScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, topic, difficulty, questionCount, timeLimit,
      startTime, assignedStudents, customQuestions,
    } = req.body;

    const adminId = (req as Request & { user?: { id: string } }).user?.id;
    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const test = await ScheduledTest.create({
      title,
      topic,
      difficulty:    difficulty || 'all',
      questionCount: questionCount || 30,
      timeLimit:     timeLimit || 60,
      startTime:     new Date(startTime),
      assignedStudents: (assignedStudents as string[] || []).map(id => new mongoose.Types.ObjectId(id)),
      createdBy: new mongoose.Types.ObjectId(adminId),
      status: new Date(startTime) > new Date() ? 'locked' : 'live',
      customQuestions: customQuestions ? (customQuestions as string[]).map(id => new mongoose.Types.ObjectId(id)) : undefined,
    });

    const notifications = (assignedStudents as string[] || []).map(id => ({
      user: new mongoose.Types.ObjectId(id),
      title: 'New Test Assigned',
      message: `You have been assigned a new test: ${title}. Scheduled for ${new Date(startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      type: 'test_assigned',
      relatedEntity: test._id,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Get all scheduled tests ───────────────────────────────────────
export const getScheduledTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const tests = await ScheduledTest
      .find()
      .sort({ startTime: -1 })
      .populate('assignedStudents', 'name email')
      .populate('createdBy', 'name email');

    // Refresh status before returning
    const now = Date.now();
    const formatted = tests.map(t => {
      const start = t.startTime.getTime();
      const end   = start + t.timeLimit * 60_000;
      const status = now < start ? 'locked' : now < end ? 'live' : 'completed';
      return { ...t.toObject(), status };
    });

    res.status(200).json({ success: true, data: formatted, count: formatted.length });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get scheduled tests for a specific student ────────────────────
export const getMyScheduledTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = (req as Request & { user?: { id: string } }).user?.id;
    const now       = Date.now();

    const tests = await ScheduledTest
      .find({ assignedStudents: new mongoose.Types.ObjectId(studentId) })
      .sort({ startTime: 1 });

    const formatted = tests.map(t => {
      const start  = t.startTime.getTime();
      const end    = start + t.timeLimit * 60_000;
      const status = now < start ? 'locked' : now < end ? 'live' : 'completed';
      return { ...t.toObject(), status };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update a scheduled test ───────────────────────────────────────
export const updateScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const test = await ScheduledTest.findByIdAndUpdate(id, req.body, {
      new:            true,
      runValidators:  true,
    });
    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }
    res.status(200).json({ success: true, data: test });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Delete a scheduled test ───────────────────────────────────────
export const deleteScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const test = await ScheduledTest.findByIdAndDelete(id);
    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Scheduled test deleted' });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Start a scheduled test (Student starts taking the test) ───────
export const startScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: testId } = req.params;
    const studentId = (req as Request & { user?: { id: string } }).user?.id;

    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // ─── Step 1: Fetch scheduled test ──────────────────────────
    const scheduledTest = await ScheduledTest
      .findById(testId)
      .populate('customQuestions');

    if (!scheduledTest) {
      res.status(404).json({ success: false, message: 'Scheduled test not found' });
      return;
    }

    // ─── Step 2: Verify student is assigned to this test ────────
    const isAssigned = scheduledTest.assignedStudents.some(
      id => id.toString() === studentId
    );

    if (!isAssigned) {
      res.status(403).json({ success: false, message: 'You are not assigned to this test' });
      return;
    }

    // ─── Step 3: Check if test is live (not locked or completed) ─
    const now = Date.now();
    const start = scheduledTest.startTime.getTime();
    const end = start + scheduledTest.timeLimit * 60_000;

    if (now < start) {
      res.status(400).json({ success: false, message: 'Test has not started yet' });
      return;
    }

    if (now >= end) {
      res.status(400).json({ success: false, message: 'Test session has ended' });
      return;
    }

    // ─── Step 4: Get questions from scheduled test ─────────────
    let questions = scheduledTest.customQuestions || [];

    // If no custom questions, fetch by topic/difficulty (fallback)
    if (!questions || questions.length === 0) {
      const filter: Record<string, string> = { topic: scheduledTest.topic };
      if (scheduledTest.difficulty !== 'all') {
        filter.difficulty = scheduledTest.difficulty;
      }
      questions = await Question
        .find(filter)
        .limit(scheduledTest.questionCount)
        .select('-correctAnswer -explanation');
    } else {
      // Hide correct answers and explanations
      questions = questions.map((q: any) => {
        const obj = q.toObject ? q.toObject() : q;
        delete obj.correctAnswer;
        delete obj.explanation;
        return obj;
      });
    }

    // ─── Step 5: Create TestAttempt with scheduled test reference ─
    const attempt = await TestAttempt.create({
      user: new mongoose.Types.ObjectId(studentId),
      testType: 'custom',
      title: scheduledTest.title,
      questions: questions.map((q: any) => q._id),
      answers: [],
      score: 0,
      totalQuestions: questions.length,
      correct: 0,
      incorrect: 0,
      skipped: 0,
      totalTime: 0,
      topicPerformance: {},
      scheduledTest: new mongoose.Types.ObjectId(testId),
    });

    // ─── Step 6: Return response ──────────────────────────────
    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        title: scheduledTest.title,
        totalQuestions: questions.length,
        questions,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error starting scheduled test:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
