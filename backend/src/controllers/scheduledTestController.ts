// backend/src/controllers/scheduledTestController.ts
// CRUD for admin-created scheduled tests

import { Request, Response } from 'express';
import ScheduledTest from '../models/ScheduledTest';
import mongoose from 'mongoose';

// ── Create a scheduled test ───────────────────────────────────────
export const createScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title, topic, difficulty, questionCount, timeLimit,
      startTime, assignedStudents,
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
    });

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
