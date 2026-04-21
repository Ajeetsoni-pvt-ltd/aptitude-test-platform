// backend/src/controllers/testController.ts
// ─────────────────────────────────────────────────────────────
// Test Controller
// startTest      → POST /api/tests/start
// submitTest     → POST /api/tests/:attemptId/submit
// getMyResults   → GET  /api/tests/my-results
// getAttemptById → GET  /api/tests/:attemptId
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Question, { OPTION_LETTERS } from '../models/Question';
import TestAttempt from '../models/TestAttempt';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import { normalizeQuestions } from '../utils/normalizeQuestion';

const normalizeTopic = (topic: unknown) =>
  typeof topic === 'string' ? topic.trim() : '';

// ═══════════════════════════════════════════════════════════════
// @desc    Get subtopics for a specific topic
// @route   GET /api/tests/subtopics/:topic
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const getSubtopics = asyncHandler(async (req: Request, res: Response) => {
  const topic = normalizeTopic(req.params.topic);

  if (!topic) {
    res.status(400).json(errorResponse('Topic parameter is required.'));
    return;
  }

  console.info('[tests:get-subtopics]', { topic });

  const subtopics = await Question.distinct('subtopic', {
    topic,
    subtopic: { $nin: ['', null] }
  });

  const normalizedSubtopics = (subtopics || [])
    .filter((subtopic): subtopic is string => typeof subtopic === 'string' && Boolean(subtopic.trim()))
    .map((subtopic) => subtopic.trim())
    .sort((first, second) => first.localeCompare(second));

  console.info('[tests:get-subtopics:result]', {
    topic,
    total: normalizedSubtopics.length,
  });

  res.status(200).json(
    successResponse('Subtopics fetched successfully.', {
      topic,
      subtopics: normalizedSubtopics,
      total: normalizedSubtopics.length,
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Start a new test attempt
// @route   POST /api/tests/start
// @access  Private (login required)
// ═══════════════════════════════════════════════════════════════
export const startTest = asyncHandler(async (req: Request, res: Response) => {
  const { topic, difficulty, count, title, testType, subtopics } = req.body;

  // ─── Step 1: Validation ────────────────────────────────────
  if (!topic || !count) {
    res.status(400).json(errorResponse('topic aur count required hain.'));
    return;
  }

  const questionCount = parseInt(count);
  if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
    res.status(400).json(errorResponse('count 1 se 50 ke beech hona chahiye.'));
    return;
  }

  // ─── Step 2: Filter banao ──────────────────────────────────
  const filter: Record<string, any> = { topic };
  if (difficulty) filter.difficulty = difficulty;
  
  // Add subtopic filter if provided
  if (subtopics && Array.isArray(subtopics) && subtopics.length > 0) {
    filter.subtopic = { $in: subtopics };
  }

  // ─── Step 3: DB mein kitne questions available hain? ───────
  const availableCount = await Question.countDocuments(filter);

  if (availableCount < questionCount) {
    res.status(400).json(
      errorResponse(
        `Sirf ${availableCount} questions available hain "${topic}" mein. ` +
        `${questionCount} nahi mil sakte.`
      )
    );
    return;
  }

  // ─── Step 4: Random questions fetch karo ──────────────────
  // $sample → MongoDB ka aggregation operator for random selection
  // Yeh method bada efficient hai large collections ke liye [web:61]
  const questions = await Question.aggregate([
    { $match: filter },
    { $sample: { size: questionCount } },
    {
      // correctAnswer aur explanation HIDE karo!
      // Student test dete waqt answer nahi dekhna chahiye
      $project: {
        correctAnswer: 0,
        explanation: 0,
        __v: 0,
      },
    },
  ]);
  const normalizedQuestions = normalizeQuestions(questions);

  // ─── Step 5: TestAttempt create karo (empty answers) ───────
  const attempt = await TestAttempt.create({
    user: req.user!.id,
    testType: testType || 'practice',
    title: title || `${topic} Test - ${new Date().toLocaleDateString('en-IN')}`,
    questions: questions.map((q) => q._id),
    answers: [],              // Submit ke time bhaega
    score: 0,                 // Submit ke time calculate hoga
    totalQuestions: questionCount,
    correctCount: 0,
    incorrectCount: 0,
    skippedCount: 0,
    totalTime: 0,
    topicPerformance: {},
  });

  // ─── Step 6: Response bhejo ────────────────────────────────
  res.status(201).json(
    successResponse('Test successfully start ho gaya! All the best! 🎯', {
      attemptId: attempt._id,  // Submit ke time yahi ID chahiye
      title: attempt.title,
      totalQuestions: questionCount,
      questions: normalizedQuestions, // correctAnswer nahi hai inme!
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Submit test answers and calculate results
// @route   POST /api/tests/:attemptId/submit
// @access  Private (sirf wahi user jo test start kiya)
// ═══════════════════════════════════════════════════════════════
export const submitTest = asyncHandler(async (req: Request, res: Response) => {
  const { attemptId } = req.params;
  const { answers, totalTime } = req.body;
  // answers format: [{ questionId, selectedAnswer, timeSpent }]

  // ─── Step 1: Attempt dhundo ────────────────────────────────
  const attempt = await TestAttempt.findById(attemptId);

  if (!attempt) {
    res.status(404).json(errorResponse('Test attempt nahi mila. ID check karo.'));
    return;
  }

  // ─── Step 2: Sirf apna attempt submit kar sakta hai ────────
  if (attempt.user.toString() !== req.user!.id) {
    res.status(403).json(
      errorResponse('Tum sirf apna test submit kar sakte ho.')
    );
    return;
  }

  // ─── Step 3: Already submit ho chuka hai? ──────────────────
  if (attempt.answers.length > 0) {
    res.status(400).json(
      errorResponse('Yeh test already submit ho chuka hai. Dobara submit nahi kar sakte.')
    );
    return;
  }

  // ─── Step 4: DB se original questions fetch karo ──────────
  // Ab correctAnswer chahiye — isliye ab bhej rahe hain, test ke waqt nahi
  const questionIds = attempt.questions;
  const questionsFromDB = await Question.find({ _id: { $in: questionIds } });
  const normalizedQuestions = normalizeQuestions(questionsFromDB);

  // Quick lookup ke liye Map banao: questionId → question object
  const questionMap = new Map(
    normalizedQuestions.map((q) => [q._id.toString(), q])
  );

  // ─── Step 5: Har answer evaluate karo ─────────────────────
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  // topicPerformance: { "Percentage": { correct: 3, total: 5 }, ... }
  const topicPerformance: Record<string, { correct: number; total: number }> = {};

  // Processed answers array (DB mein save hoga)
  const processedAnswers = questionIds.map((qId) => {
    const qIdStr = qId.toString();
    const question = questionMap.get(qIdStr);

    // Student ne yeh question ka answer diya?
    const submittedAnswer = answers?.find(
      (a: { questionId: string; selectedAnswer: string; timeSpent: number }) =>
        a.questionId === qIdStr
    );

    // ─── Skipped check ─────────────────────────────────────
    if (!submittedAnswer || !submittedAnswer.selectedAnswer) {
      skippedCount++;
      // Topic performance mein bhi count karo
      if (question) {
        const topic = question.topic;
        if (!topicPerformance[topic]) topicPerformance[topic] = { correct: 0, total: 0 };
        topicPerformance[topic].total++;
      }
      return {
        question: new mongoose.Types.ObjectId(qIdStr),
        selectedAnswer: '',
        isCorrect: false,
        timeSpent: 0,
      };
    }

    // ─── Correct/Incorrect check ───────────────────────────
    const selectedAnswer = submittedAnswer.selectedAnswer?.toUpperCase();
    const isValidAnswer = OPTION_LETTERS.includes(selectedAnswer as (typeof OPTION_LETTERS)[number]);
    const normalizedAnswer = isValidAnswer ? selectedAnswer : '';
    const isCorrect = question?.correctAnswer === normalizedAnswer;

    if (!normalizedAnswer) {
      skippedCount++;
      if (question) {
        const topic = question.topic;
        if (!topicPerformance[topic]) topicPerformance[topic] = { correct: 0, total: 0 };
        topicPerformance[topic].total++;
      }

      return {
        question: new mongoose.Types.ObjectId(qIdStr),
        selectedAnswer: '',
        isCorrect: false,
        timeSpent: submittedAnswer.timeSpent || 0,
      };
    }

    if (isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    // ─── Topic-wise performance update ────────────────────
    if (question) {
      const topic = question.topic;
      if (!topicPerformance[topic]) topicPerformance[topic] = { correct: 0, total: 0 };
      topicPerformance[topic].total++;
      if (isCorrect) topicPerformance[topic].correct++;
    }

    return {
      question: new mongoose.Types.ObjectId(qIdStr),
      selectedAnswer: normalizedAnswer,
      isCorrect,
      timeSpent: submittedAnswer.timeSpent || 0,
    };
  });

  // ─── Step 6: Score calculate karo ─────────────────────────
  // Score = (Correct / Total) * 100 → percentage
  const score = Math.round((correctCount / attempt.totalQuestions) * 100);

  // ─── Step 7: TestAttempt DB mein update karo ──────────────
  const updatedAttempt = await TestAttempt.findByIdAndUpdate(
    attemptId,
    {
      answers: processedAnswers,
      score,
      correctCount,
      incorrectCount,
      skippedCount,
      totalTime: totalTime || 0,
      topicPerformance,
    },
    { new: true }
  );

  // ─── Step 8: Response bhejo ────────────────────────────────
  res.status(200).json(
    successResponse('Test submit ho gaya! Dekho tumhara result 🎉', {
      score,
      totalQuestions: attempt.totalQuestions,
      correctCount,
      incorrectCount,
      skippedCount,
      totalTime: totalTime || 0,
      topicPerformance,
      attemptId: updatedAttempt?._id,
    })
  );
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get all test attempts of logged-in user
// @route   GET /api/tests/my-results
// @access  Private
// ═══════════════════════════════════════════════════════════════
export const getMyResults = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    const limitNumber = Math.min(20, parseInt(limit as string) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    const [attempts, totalCount] = await Promise.all([
      TestAttempt.find({ user: req.user!.id })
        .sort({ createdAt: -1 })   // Latest first
        .skip(skip)
        .limit(limitNumber)
        .select('-answers -questions') // Summary only (detailed data chhota raho)
        .lean(),                       // .lean() → plain JS object, faster
      TestAttempt.countDocuments({ user: req.user!.id }),
    ]);

    res.status(200).json(
      successResponse('Tumhare saare test results mil gaye!', {
        attempts,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          totalAttempts: totalCount,
        },
      })
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Get single attempt with full detail (answers + questions)
// @route   GET /api/tests/:attemptId
// @access  Private (sirf apna attempt dekh sakte ho)
// ═══════════════════════════════════════════════════════════════
export const getAttemptById = asyncHandler(
  async (req: Request, res: Response) => {
    // populate → questions ke details bhi aayenge (sirf IDs nahi)
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('questions', '-__v') // Question details aayenge
      .lean();

    if (!attempt) {
      res.status(404).json(errorResponse('Yeh test attempt nahi mila.'));
      return;
    }

    // Sirf apna attempt dekh sakta hai
    if (attempt.user.toString() !== req.user!.id) {
      res.status(403).json(
        errorResponse('Tum sirf apna test attempt dekh sakte ho.')
      );
      return;
    }

    const normalizedAttempt = {
      ...attempt,
      questions: normalizeQuestions((attempt.questions || []) as unknown[]),
    };

    res.status(200).json(
      successResponse('Test attempt detail mil gayi!', normalizedAttempt)
    );
  }
);
