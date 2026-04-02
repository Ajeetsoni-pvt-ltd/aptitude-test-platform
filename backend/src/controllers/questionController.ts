import { Request, Response } from 'express';
import XLSX from 'xlsx';
import Question, { OPTION_LETTERS } from '../models/Question';
import ScheduledTest from '../models/ScheduledTest';
import TestAttempt from '../models/TestAttempt';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import {
  parseOptionsPayload,
  sanitizeQuestionInput,
  validateQuestionInput,
} from '../utils/questionValidation';
import type { SanitizedQuestionInput } from '../utils/questionValidation';
import { storeUploadedImage } from '../services/imageStorage';
import { processBulkQuestionUpload } from '../services/questionBulkUploadService';
import { normalizeQuestion, normalizeQuestions } from '../utils/normalizeQuestion';

const getUploadedFiles = (req: Request) =>
  ((req.files as Record<string, Express.Multer.File[]>) || {}) as Record<
    string,
    Express.Multer.File[]
  >;

const getFirstFile = (req: Request, fieldName: string) => getUploadedFiles(req)[fieldName]?.[0];

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const buildQuestionFilter = ({
  topic,
  subtopic,
  difficulty,
}: {
  topic?: unknown;
  subtopic?: unknown;
  difficulty?: unknown;
}) => {
  const filter: Record<string, string> = {};
  const normalizedTopic = normalizeOptionalString(topic);
  const normalizedSubtopic = normalizeOptionalString(subtopic);
  const normalizedDifficulty = normalizeOptionalString(difficulty);

  if (normalizedTopic) filter.topic = normalizedTopic;
  if (normalizedSubtopic) filter.subtopic = normalizedSubtopic;
  if (normalizedDifficulty) filter.difficulty = normalizedDifficulty;

  return filter;
};

const getProtectedQuestionIds = async (questionIds: string[]) => {
  if (questionIds.length === 0) {
    return new Set<string>();
  }

  const requestedIds = new Set(questionIds);
  const [scheduledTests, attempts] = await Promise.all([
    ScheduledTest.find({
      customQuestions: { $in: questionIds },
    })
      .select('customQuestions')
      .lean(),
    TestAttempt.find({
      questions: { $in: questionIds },
    })
      .select('questions')
      .lean(),
  ]);

  const protectedIds = new Set<string>();

  scheduledTests.forEach((test) => {
    (test.customQuestions || []).forEach((questionId) => {
      const value = questionId?.toString();
      if (value && requestedIds.has(value)) {
        protectedIds.add(value);
      }
    });
  });

  attempts.forEach((attempt) => {
    (attempt.questions || []).forEach((questionId) => {
      const value = questionId?.toString();
      if (value && requestedIds.has(value)) {
        protectedIds.add(value);
      }
    });
  });

  return protectedIds;
};

const buildDeletionScopeLabel = (filter: Record<string, string>) => {
  const segments = [`topic "${filter.topic}"`];

  if (filter.subtopic) {
    segments.push(`subtopic "${filter.subtopic}"`);
  }

  if (filter.difficulty) {
    segments.push(`difficulty "${filter.difficulty}"`);
  }

  return segments.join(' / ');
};

const buildManualQuestionDraft = (req: Request): SanitizedQuestionInput => {
  const questionImageFile = getFirstFile(req, 'questionImage');

  return sanitizeQuestionInput({
    topic: req.body.topic,
    subtopic: req.body.subtopic,
    difficulty: req.body.difficulty,
    questionText: req.body.questionText,
    questionImage: questionImageFile ? '__IMAGE__' : undefined,
    options: OPTION_LETTERS.map((letter) => ({
      text: req.body[`option${letter}_text`],
      image: getFirstFile(req, `option${letter}_image`) ? '__IMAGE__' : undefined,
    })),
    correctAnswer: req.body.correctAnswer,
    explanation: req.body.explanation,
  });
};

const buildManualQuestionPayload = async (
  req: Request,
  draft: SanitizedQuestionInput
): Promise<SanitizedQuestionInput> => {
  const questionImageFile = getFirstFile(req, 'questionImage');

  const options = await Promise.all(
    OPTION_LETTERS.map(async (letter, index) => {
      const optionImageFile = getFirstFile(req, `option${letter}_image`);

      return {
        text: draft.options[index]?.text,
        image: optionImageFile ? await storeUploadedImage(optionImageFile, req) : undefined,
      };
    })
  );

  return {
    ...draft,
    questionImage: questionImageFile ? await storeUploadedImage(questionImageFile, req) : undefined,
    options,
  };
};

const sendValidationIssues = (res: Response, issues: string[]) => {
  res.status(400).json({
    success: false,
    message: issues[0] || 'Validation failed.',
    data: { issues },
  });
};

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const draft = buildManualQuestionDraft(req);
  const issues = validateQuestionInput(draft);

  if (issues.length > 0) {
    sendValidationIssues(res, issues);
    return;
  }

  const payload = await buildManualQuestionPayload(req, draft);
  const question = await Question.create(payload);

  res
    .status(201)
    .json(successResponse('Question created successfully.', normalizeQuestion(question)));
});

export const bulkUploadQuestions = asyncHandler(async (req: Request, res: Response) => {
  const workbookFile = getFirstFile(req, 'file');
  const imagesZipFile = getFirstFile(req, 'imagesZip');
  const mode = req.query.mode === 'confirm' ? 'confirm' : 'preview';

  if (!workbookFile) {
    res
      .status(400)
      .json(errorResponse('A .xlsx or .csv workbook is required in the "file" field.'));
    return;
  }

  const result = await processBulkQuestionUpload({
    workbookFile,
    imagesZipFile,
    mode,
    req,
  });

  if (result.summary.totalRows === 0) {
    res.status(400).json(errorResponse('The workbook does not contain any question rows.'));
    return;
  }

  if (mode === 'confirm' && result.summary.invalidRows > 0) {
    res.status(400).json({
      success: false,
      message: 'Fix the highlighted row errors before confirming the upload.',
      data: result,
    });
    return;
  }

  const successMessage =
    mode === 'confirm'
      ? `${result.summary.savedRows} questions uploaded successfully.`
      : 'Workbook parsed successfully. Review the preview before uploading.';

  res.status(mode === 'confirm' ? 201 : 200).json(successResponse(successMessage, result));
});

export const downloadBulkTemplate = asyncHandler(async (_req: Request, res: Response) => {
  const workbook = XLSX.utils.book_new();

  const questionsSheet = XLSX.utils.json_to_sheet([
    {
      topic: 'Quantitative Aptitude',
      subtopic: 'Percentages',
      difficulty: 'easy',
      question: 'What is 25% of 200?',
      question_image: '',
      A: '25',
      A_image: '',
      B: '40',
      B_image: '',
      C: '50',
      C_image: '',
      D: '75',
      D_image: '',
      answer: 'C',
      explanation: '25% of 200 is 50.',
    },
  ]);

  questionsSheet['!cols'] = [
    { wch: 24 },
    { wch: 20 },
    { wch: 12 },
    { wch: 36 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 10 },
    { wch: 36 },
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet([
    ['Question Upload Instructions'],
    [''],
    ['Headers', 'topic | subtopic | difficulty | question | question_image | A | A_image | B | B_image | C | C_image | D | D_image | answer | explanation'],
    ['Difficulty', 'Use only easy, medium, or hard'],
    ['Answer', 'Use only A, B, C, or D'],
    ['Image columns', 'Use a direct image URL or a filename that exists inside the uploaded .zip bundle'],
    ['Rules', 'Each question must have text or image. Each option must have text or image. Exactly 4 options are required.'],
  ]);

  XLSX.utils.book_append_sheet(workbook, questionsSheet, 'Questions');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  const fileBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="question-bulk-upload-template.xlsx"'
  );
  res.send(fileBuffer);
});

export const getAllQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;
  const filter = buildQuestionFilter(req.query);

  const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNumber = Math.min(100, parseInt(limit as string, 10) || 10);
  const skip = (pageNumber - 1) * limitNumber;

  const [questions, totalCount] = await Promise.all([
    Question.find(filter).skip(skip).limit(limitNumber).sort({ createdAt: -1 }).select('-__v'),
    Question.countDocuments(filter),
  ]);

  res.status(200).json(
    successResponse('Questions fetched successfully.', {
      questions: normalizeQuestions(questions),
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalCount / limitNumber),
        totalQuestions: totalCount,
        limit: limitNumber,
      },
    })
  );
});

export const getQuestionById = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id).select('-__v');

  if (!question) {
    res.status(404).json(errorResponse('Question not found.'));
    return;
  }

  res.status(200).json(successResponse('Question fetched successfully.', normalizeQuestion(question)));
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const existingQuestion = await Question.findById(req.params.id);

  if (!existingQuestion) {
    res.status(404).json(errorResponse('Question not found.'));
    return;
  }

  const optionsFromBody = parseOptionsPayload(req.body.options);

  const payload = sanitizeQuestionInput({
    topic: req.body.topic ?? existingQuestion.topic,
    subtopic: req.body.subtopic ?? existingQuestion.subtopic,
    difficulty: req.body.difficulty ?? existingQuestion.difficulty,
    questionText: req.body.questionText ?? existingQuestion.questionText,
    questionImage: req.body.questionImage ?? existingQuestion.questionImage,
    options: optionsFromBody ?? existingQuestion.options,
    correctAnswer: req.body.correctAnswer ?? existingQuestion.correctAnswer,
    explanation: req.body.explanation ?? existingQuestion.explanation,
  });

  const issues = validateQuestionInput(payload);

  if (issues.length > 0) {
    sendValidationIssues(res, issues);
    return;
  }

  const updatedQuestion = await Question.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  }).select('-__v');

  res
    .status(200)
    .json(successResponse('Question updated successfully.', updatedQuestion ? normalizeQuestion(updatedQuestion) : updatedQuestion));
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    res.status(404).json(errorResponse('Question not found.'));
    return;
  }

  const protectedIds = await getProtectedQuestionIds([req.params.id]);
  if (protectedIds.has(req.params.id)) {
    res.status(409).json(
      errorResponse(
        'This question is already linked to a scheduled test or past attempt and cannot be deleted.'
      )
    );
    return;
  }

  await Question.findByIdAndDelete(req.params.id);

  res.status(200).json(
    successResponse('Question deleted successfully.', {
      deletedId: req.params.id,
    })
  );
});

export const bulkDeleteQuestions = asyncHandler(async (req: Request, res: Response) => {
  const filter = buildQuestionFilter(req.body);

  if (!filter.topic) {
    res.status(400).json(errorResponse('Select a topic before running bulk delete.'));
    return;
  }

  if (filter.difficulty && !['easy', 'medium', 'hard'].includes(filter.difficulty)) {
    res.status(400).json(errorResponse('Difficulty must be easy, medium, or hard.'));
    return;
  }

  const matchingQuestions = await Question.find(filter).select('_id').lean();
  const matchingIds = matchingQuestions.map((question) => question._id.toString());

  if (matchingIds.length === 0) {
    res.status(404).json(errorResponse('No questions matched the selected bulk-delete scope.'));
    return;
  }

  const protectedIds = await getProtectedQuestionIds(matchingIds);
  const deletableIds = matchingIds.filter((id) => !protectedIds.has(id));

  if (deletableIds.length > 0) {
    await Question.deleteMany({ _id: { $in: deletableIds } });
  }

  const blockedCount = matchingIds.length - deletableIds.length;
  const scopeLabel = buildDeletionScopeLabel(filter);

  const message =
    blockedCount > 0
      ? `${deletableIds.length} questions deleted from ${scopeLabel}. ${blockedCount} linked questions were kept because they are used in scheduled tests or past attempts.`
      : `${deletableIds.length} questions deleted from ${scopeLabel}.`;

  res.status(200).json(
    successResponse(message, {
      matchedCount: matchingIds.length,
      deletedCount: deletableIds.length,
      blockedCount,
      scope: {
        topic: filter.topic,
        subtopic: filter.subtopic || null,
        difficulty: filter.difficulty || null,
      },
    })
  );
});
