import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import Question from '../models/Question';
import ScheduledTest from '../models/ScheduledTest';
import TestAttempt from '../models/TestAttempt';
import { processBulkQuestionUpload } from '../services/questionBulkUploadService';
import { normalizeQuestions } from '../utils/normalizeQuestion';

type AuthenticatedRequest = Request & { user?: { id: string } };

const getUploadedFiles = (req: Request) =>
  ((req.files as Record<string, Express.Multer.File[]>) || {}) as Record<
    string,
    Express.Multer.File[]
  >;

const getFirstFile = (req: Request, fieldName: string) => getUploadedFiles(req)[fieldName]?.[0];

const getAuthenticatedUserId = (req: Request) => (req as AuthenticatedRequest).user?.id;

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0
      );
    }
  } catch {
    // Fall through to comma-separated parsing.
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseObjectIdArray = (value: unknown) =>
  parseStringArray(value)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

const parseBoolean = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }

  return fallback;
};

const parsePositiveNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isValidDate = (value: Date) => !Number.isNaN(value.getTime());

const computeStatus = (startTime: Date, endTime: Date) => {
  const now = Date.now();
  const start = startTime.getTime();
  const end = endTime.getTime();

  if (now < start) return 'locked';
  if (now < end) return 'live';
  return 'completed';
};

const buildAssignedNotifications = (
  studentIds: mongoose.Types.ObjectId[],
  testId: mongoose.Types.ObjectId,
  testTitle: string
) =>
  studentIds.map((studentId) => ({
    user: studentId,
    title: testTitle,
    message: 'A new test has been assigned to you.',
    type: 'test_assigned' as const,
    relatedEntity: testId,
  }));

export const createScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = getAuthenticatedUserId(req);
    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const topic =
      typeof req.body.topic === 'string' && req.body.topic.trim()
        ? req.body.topic.trim()
        : 'Mixed Topics';
    const difficulty =
      typeof req.body.difficulty === 'string' ? req.body.difficulty : 'all';
    const questionCount = parsePositiveNumber(req.body.questionCount, 30);
    const timeLimit = parsePositiveNumber(req.body.timeLimit, 60);
    const startTime = new Date(req.body.startTime);
    const endTime = req.body.endTime
      ? new Date(req.body.endTime)
      : new Date(startTime.getTime() + timeLimit * 60_000);
    const assignedStudents = parseObjectIdArray(req.body.assignedStudents);
    const customQuestions = parseObjectIdArray(req.body.customQuestions);

    if (!title) {
      res.status(400).json({ success: false, message: 'Test title is required.' });
      return;
    }

    if (!isValidDate(startTime) || !isValidDate(endTime)) {
      res.status(400).json({ success: false, message: 'Valid start and end times are required.' });
      return;
    }

    if (endTime <= startTime) {
      res.status(400).json({ success: false, message: 'End time must be after start time.' });
      return;
    }

    if (assignedStudents.length === 0) {
      res.status(400).json({ success: false, message: 'Select at least one student.' });
      return;
    }

    const test = await ScheduledTest.create({
      title,
      topic,
      difficulty,
      questionCount,
      timeLimit,
      startTime,
      endTime,
      maxAttempts: parsePositiveNumber(req.body.maxAttempts, 1),
      sendNotification: true,
      assignedStudents,
      createdBy: new mongoose.Types.ObjectId(adminId),
      status: computeStatus(startTime, endTime),
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
    });

    const notifications = buildAssignedNotifications(assignedStudents, test._id, title);
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getScheduledTests = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tests = await ScheduledTest.find()
      .sort({ startTime: -1 })
      .populate('assignedStudents', 'name email')
      .populate('createdBy', 'name email');

    const formatted = tests.map((test) => ({
      ...test.toObject(),
      status: computeStatus(test.startTime, test.endTime),
    }));

    res.status(200).json({ success: true, data: formatted, count: formatted.length });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyScheduledTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = getAuthenticatedUserId(req);
    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const tests = await ScheduledTest.find({
      assignedStudents: new mongoose.Types.ObjectId(studentId),
    }).sort({ startTime: 1 });

    const formatted = tests.map((test) => ({
      ...test.toObject(),
      status: computeStatus(test.startTime, test.endTime),
    }));

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payload = { ...req.body } as Record<string, unknown>;

    if (payload.assignedStudents !== undefined) {
      payload.assignedStudents = parseObjectIdArray(payload.assignedStudents);
    }

    if (payload.customQuestions !== undefined) {
      payload.customQuestions = parseObjectIdArray(payload.customQuestions);
    }

    const test = await ScheduledTest.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!test) {
      res.status(404).json({ success: false, message: 'Test not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        ...test.toObject(),
        status: computeStatus(test.startTime, test.endTime),
      },
    });
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ success: false, message: err.message });
  }
};

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

export const startScheduledTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: testId } = req.params;
    const studentId = getAuthenticatedUserId(req);

    if (!studentId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const scheduledTest = await ScheduledTest.findById(testId).populate('customQuestions');

    if (!scheduledTest) {
      res.status(404).json({ success: false, message: 'Scheduled test not found' });
      return;
    }

    const isAssigned = scheduledTest.assignedStudents.some((id) => id.toString() === studentId);
    if (!isAssigned) {
      res.status(403).json({ success: false, message: 'You are not assigned to this test' });
      return;
    }

    if (scheduledTest.maxAttempts < Infinity) {
      const studentAttempts = await TestAttempt.countDocuments({
        user: new mongoose.Types.ObjectId(studentId),
        scheduledTest: new mongoose.Types.ObjectId(testId),
      });

      if (studentAttempts >= scheduledTest.maxAttempts) {
        res.status(409).json({
          success: false,
          message: `You have already attempted this test ${studentAttempts} time(s). Maximum ${scheduledTest.maxAttempts} attempt(s) allowed.`,
          code: 'MAX_ATTEMPTS_REACHED',
          data: {
            maxAttempts: scheduledTest.maxAttempts,
            currentAttempts: studentAttempts,
          },
        });
        return;
      }
    }

    const now = Date.now();
    const start = scheduledTest.startTime.getTime();
    const end = scheduledTest.endTime.getTime();

    if (now < start) {
      res.status(400).json({ success: false, message: 'Test has not started yet' });
      return;
    }

    if (now >= end) {
      res.status(400).json({ success: false, message: 'Test session has ended' });
      return;
    }

    let questions = scheduledTest.customQuestions || [];

    if (!questions || questions.length === 0) {
      const filter: Record<string, string> = {};
      if (scheduledTest.topic) filter.topic = scheduledTest.topic;
      if (scheduledTest.difficulty !== 'all') filter.difficulty = scheduledTest.difficulty;

      questions = await Question.find(filter)
        .limit(scheduledTest.questionCount)
        .select('-correctAnswer -explanation');
    } else {
      questions = questions.map((question: any) => {
        const questionObject = question.toObject ? question.toObject() : question;
        delete questionObject.correctAnswer;
        delete questionObject.explanation;
        return questionObject;
      });
    }

    if (!questions || questions.length === 0) {
      res.status(400).json({ success: false, message: 'This test does not contain any questions.' });
      return;
    }

    const normalizedQuestions = normalizeQuestions(questions as unknown[]);

    const durationSeconds = Math.min(
      scheduledTest.timeLimit * 60,
      Math.max(0, Math.floor((end - now) / 1000))
    );

    if (durationSeconds <= 0) {
      res.status(400).json({ success: false, message: 'Test session has ended' });
      return;
    }

    const attempt = await TestAttempt.create({
      user: new mongoose.Types.ObjectId(studentId),
      testType: 'custom',
      title: scheduledTest.title,
      questions: questions.map((question: any) => question._id),
      answers: [],
      score: 0,
      totalQuestions: questions.length,
      correctCount: 0,
      incorrectCount: 0,
      skippedCount: 0,
      totalTime: 0,
      topicPerformance: {},
      scheduledTest: new mongoose.Types.ObjectId(testId),
    });

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id,
        title: scheduledTest.title,
        totalQuestions: questions.length,
        questions: normalizedQuestions,
        durationSeconds,
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Error starting scheduled test:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createFullLengthTest = async (req: Request, res: Response): Promise<void> => {
  let savedQuestionIds: string[] = [];

  try {
    const adminId = getAuthenticatedUserId(req);
    if (!adminId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    const testCode =
      typeof req.body.testCode === 'string' && req.body.testCode.trim()
        ? req.body.testCode.trim()
        : undefined;
    const topic =
      typeof req.body.topic === 'string' && req.body.topic.trim()
        ? req.body.topic.trim()
        : 'Mixed Topics';
    const timeLimit = parsePositiveNumber(req.body.timeLimit, 180);
    const startTime = new Date(req.body.startTime);
    const endTime = new Date(req.body.endTime);
    const assignedStudents = parseObjectIdArray(req.body.assignedStudents);

    if (!title) {
      res.status(400).json({ success: false, message: 'Test title is required' });
      return;
    }

    if (!isValidDate(startTime) || !isValidDate(endTime)) {
      res.status(400).json({ success: false, message: 'Valid start and end times are required' });
      return;
    }

    if (endTime <= startTime) {
      res.status(400).json({ success: false, message: 'End time must be after start time' });
      return;
    }

    if (assignedStudents.length === 0) {
      res.status(400).json({ success: false, message: 'Select at least one student.' });
      return;
    }

    if (timeLimit * 60_000 > endTime.getTime() - startTime.getTime()) {
      res.status(400).json({
        success: false,
        message: 'Test duration cannot exceed the scheduled access window.',
      });
      return;
    }

    const workbookFile =
      getFirstFile(req, 'file') ?? getFirstFile(req, 'excelFile') ?? (req as any).file;
    const imagesZipFile = getFirstFile(req, 'imagesZip');

    if (!workbookFile) {
      res.status(400).json({ success: false, message: 'A .xlsx or .csv workbook is required.' });
      return;
    }

    const uploadResult = await processBulkQuestionUpload({
      workbookFile,
      imagesZipFile,
      mode: 'confirm',
      req,
    });

    if (uploadResult.summary.totalRows === 0) {
      res.status(400).json({ success: false, message: 'The workbook does not contain any question rows.' });
      return;
    }

    if (uploadResult.summary.invalidRows > 0) {
      res.status(400).json({
        success: false,
        message: 'Fix the highlighted row errors before creating the test.',
        data: { uploadResult },
      });
      return;
    }

    if (uploadResult.questionIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid questions were created from the uploaded workbook.',
        data: { uploadResult },
      });
      return;
    }

    savedQuestionIds = uploadResult.questionIds;

    const test = await ScheduledTest.create({
      title,
      testCode,
      topic,
      difficulty: 'all',
      questionCount: uploadResult.summary.savedRows,
      timeLimit,
      startTime,
      endTime,
      oneAttemptOnly: true,
      sendNotification: true,
      assignedStudents,
      createdBy: new mongoose.Types.ObjectId(adminId),
      status: computeStatus(startTime, endTime),
      customQuestions: savedQuestionIds.map((id) => new mongoose.Types.ObjectId(id)),
    });

    try {
      const notifications = buildAssignedNotifications(assignedStudents, test._id, title);
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notificationError) {
      await ScheduledTest.findByIdAndDelete(test._id);
      await Question.deleteMany({
        _id: { $in: savedQuestionIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
      throw notificationError;
    }

    res.status(201).json({
      success: true,
      data: {
        test,
        uploadResult,
      },
    });
  } catch (error) {
    if (savedQuestionIds.length > 0) {
      try {
        const linkedTest = await ScheduledTest.findOne({
          customQuestions: {
            $all: savedQuestionIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        }).select('_id');

        if (!linkedTest) {
          await Question.deleteMany({
            _id: { $in: savedQuestionIds.map((id) => new mongoose.Types.ObjectId(id)) },
          });
        }
      } catch {
        // Best-effort cleanup only.
      }
    }

    const err = error as Error;
    console.error('Error creating full-length test:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
