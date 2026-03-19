// backend/src/controllers/questionController.ts
// ─────────────────────────────────────────────────────────────
// Question Controller: Admin CRUD + Public Read
// createQuestion  → POST   /api/questions       (Admin)
// getAllQuestions → GET    /api/questions        (All - filter + paginate)
// getQuestionById → GET   /api/questions/:id    (All)
// updateQuestion → PUT    /api/questions/:id    (Admin)
// deleteQuestion → DELETE /api/questions/:id    (Admin)
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import Question from '../models/Question';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// ═══════════════════════════════════════════════════════════════
// @desc    Create a new question
// @route   POST /api/questions
// @access  Private → Admin only
// ═══════════════════════════════════════════════════════════════
export const createQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      topic,
      subtopic,
      concept,
      questionText,
      options,
      correctAnswer,
      explanation,
      difficulty,
    } = req.body;

    // ─── Step 1: Required fields check ────────────────────────
    if (!topic || !questionText || !options || !correctAnswer || !difficulty) {
      res.status(400).json(
        errorResponse('topic, questionText, options, correctAnswer aur difficulty required hain.')
      );
      return;
    }

    // ─── Step 2: Options exactly 4 hone chahiye ────────────────
    // Har MCQ mein exactly 4 options hote hain (A, B, C, D)
    if (!Array.isArray(options) || options.length !== 4) {
      res.status(400).json(
        errorResponse('Exactly 4 options required hain (A, B, C, D).')
      );
      return;
    }

    // ─── Step 3: correctAnswer options mein hona chahiye ──────
    if (!options.includes(correctAnswer)) {
      res.status(400).json(
        errorResponse('correctAnswer options array mein se ek hona chahiye.')
      );
      return;
    }

    // ─── Step 4: difficulty valid value check ─────────────────
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      res.status(400).json(
        errorResponse('difficulty sirf "easy", "medium" ya "hard" ho sakta hai.')
      );
      return;
    }

    // ─── Step 5: Question DB mein save karo ───────────────────
    const question = await Question.create({
      topic,
      subtopic: subtopic || '',
      concept: concept || '',
      questionText,
      options,
      correctAnswer,
      explanation: explanation || '',
      difficulty,
    });

    res.status(201).json(
      successResponse('Question successfully create ho gaya!', question)
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Get all questions with filtering + pagination
// @route   GET /api/questions
// @access  Public (login nahi bhi chahiye students ke liye)
//
// Query Params (optional):
//   ?topic=Quantitative&subtopic=Percentage&difficulty=easy
//   ?page=1&limit=10
// ═══════════════════════════════════════════════════════════════
export const getAllQuestions = asyncHandler(
  async (req: Request, res: Response) => {

    // ─── Step 1: Query params se filters nikalo ────────────────
    const { topic, subtopic, difficulty, page, limit } = req.query;

    // ─── Step 2: MongoDB filter object banao ──────────────────
    // Sirf wahi fields add karo jo request mein hain
    // Khali object = sab questions
    const filter: Record<string, string> = {};
    if (topic)      filter.topic      = topic as string;
    if (subtopic)   filter.subtopic   = subtopic as string;
    if (difficulty) filter.difficulty = difficulty as string;

    // ─── Step 3: Pagination calculate karo ────────────────────
    // Kyun pagination: 10,000 questions ek saath return karna server crash
    // Company mein hamesha paginated responses dete hain [web:46]
    const pageNumber = Math.max(1, parseInt(page as string) || 1);
    const limitNumber = Math.min(50, parseInt(limit as string) || 10); // max 50
    const skip = (pageNumber - 1) * limitNumber;

    // ─── Step 4: DB se data fetch karo ────────────────────────
    // Promise.all → dono queries parallel mein chalao (fast!)
    const [questions, totalCount] = await Promise.all([
      Question.find(filter)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: -1 }) // Newest first
        .select('-__v'),         // __v field hide karo (mongoose internal)
      Question.countDocuments(filter), // Total count for frontend pagination
    ]);

    res.status(200).json(
      successResponse('Questions fetched successfully.', {
        questions,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCount / limitNumber),
          totalQuestions: totalCount,
          limit: limitNumber,
        },
      })
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Get single question by ID
// @route   GET /api/questions/:id
// @access  Public
// ═══════════════════════════════════════════════════════════════
export const getQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    const question = await Question.findById(req.params.id).select('-__v');

    // ─── Question nahi mila ────────────────────────────────────
    if (!question) {
      res.status(404).json(
        errorResponse('Yeh question nahi mila. ID check karo.')
      );
      return;
    }

    res.status(200).json(
      successResponse('Question fetched successfully.', question)
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private → Admin only
// ═══════════════════════════════════════════════════════════════
export const updateQuestion = asyncHandler(
  async (req: Request, res: Response) => {

    // ─── Pehle check karo question exist karta hai ─────────────
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404).json(
        errorResponse('Update karna mushkil hai — yeh question exist nahi karta.')
      );
      return;
    }

    // ─── Agar options ya correctAnswer update ho raha hai ──────
    // toh validation dobara karo
    if (req.body.options && req.body.options.length !== 4) {
      res.status(400).json(errorResponse('Options exactly 4 hone chahiye.'));
      return;
    }

    if (req.body.correctAnswer && req.body.options &&
        !req.body.options.includes(req.body.correctAnswer)) {
      res.status(400).json(
        errorResponse('correctAnswer naye options mein se hona chahiye.')
      );
      return;
    }

    // ─── findByIdAndUpdate → sirf bheje gaye fields update honge ─
    // { new: true } → updated document return karo (old nahi)
    // { runValidators: true } → Mongoose schema validation chalao
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    res.status(200).json(
      successResponse('Question successfully update ho gaya!', updatedQuestion)
    );
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private → Admin only
// ═══════════════════════════════════════════════════════════════
export const deleteQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const question = await Question.findById(req.params.id);

    if (!question) {
      res.status(404).json(
        errorResponse('Delete karna mushkil hai — yeh question exist nahi karta.')
      );
      return;
    }

    // findByIdAndDelete → document delete karta hai
    await Question.findByIdAndDelete(req.params.id);

    res.status(200).json(
      successResponse('Question successfully delete ho gaya!', {
        deletedId: req.params.id,
      })
    );
  }
);
