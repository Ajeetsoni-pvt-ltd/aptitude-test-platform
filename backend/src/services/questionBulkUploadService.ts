import path from 'path';
import AdmZip from 'adm-zip';
import XLSX from 'xlsx';
import type { Request } from 'express';
import Question from '../models/Question';
import { OPTION_LETTERS } from '../models/Question';
import { buildPreviewImageUrl, storeUploadedImage } from './imageStorage';
import { sanitizeQuestionInput, validateQuestionInput } from '../utils/questionValidation';

type ImageSource =
  | { type: 'url'; value: string }
  | { type: 'file'; fileName: string; file: Express.Multer.File };

interface DraftQuestion {
  rowNumber: number;
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionText?: string;
  questionImageSource?: ImageSource;
  options: Array<{
    text?: string;
    imageSource?: ImageSource;
  }>;
  correctAnswer?: string;
  explanation?: string;
}

export interface BulkUploadRowResult {
  rowNumber: number;
  status: 'valid' | 'invalid';
  issues: string[];
  question?: {
    _id: string;
    topic: string;
    subtopic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    questionText?: string;
    questionImage?: string;
    options: Array<{ text?: string; image?: string }>;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
  };
}

export interface BulkUploadResult {
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    savedRows: number;
  };
  rows: BulkUploadRowResult[];
  questionIds: string[];
  savedQuestions?: unknown[];
}

const isBlank = (value: unknown) =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim().length === 0);

const trimCell = (value: unknown) => {
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
};

const normalizeHeader = (header: string) => header.trim().toLowerCase().replace(/\s+/g, '_');

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const buildZipFileMap = (zipFile?: Express.Multer.File) => {
  const fileMap = new Map<string, Express.Multer.File>();

  if (!zipFile) {
    return fileMap;
  }

  const zip = new AdmZip(zipFile.buffer);
  const entries = zip.getEntries();

  entries.forEach((entry: any) => {
    if (entry.isDirectory) {
      return;
    }

    const baseName = path.basename(entry.entryName).toLowerCase();
    const extension = path.extname(baseName).toLowerCase();

    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].includes(extension)) {
      return;
    }

    const buffer = entry.getData();

    fileMap.set(baseName, {
      fieldname: 'imagesZip',
      originalname: baseName,
      encoding: '7bit',
      mimetype: 'application/octet-stream',
      size: buffer.length,
      buffer,
      destination: '',
      filename: baseName,
      path: '',
      stream: undefined as never,
    });
  });

  return fileMap;
};

const resolveImageSource = (
  reference: string | undefined,
  zipFiles: Map<string, Express.Multer.File>,
  issues: string[],
  fieldLabel: string
): ImageSource | undefined => {
  if (!reference) {
    return undefined;
  }

  if (isHttpUrl(reference)) {
    return {
      type: 'url',
      value: reference,
    };
  }

  const normalizedFileName = path.basename(reference).toLowerCase();
  const matchedFile = zipFiles.get(normalizedFileName);

  if (!matchedFile) {
    issues.push(`${fieldLabel} image "${reference}" was not found in the uploaded zip file.`);
    return undefined;
  }

  return {
    type: 'file',
    fileName: matchedFile.originalname,
    file: matchedFile,
  };
};

const buildRowObject = (rawRow: Record<string, unknown>) => {
  const normalizedRow: Record<string, unknown> = {};

  Object.entries(rawRow).forEach(([key, value]) => {
    normalizedRow[normalizeHeader(key)] = value;
  });

  return normalizedRow;
};

const buildDraftQuestion = (
  rowNumber: number,
  rawRow: Record<string, unknown>,
  zipFiles: Map<string, Express.Multer.File>
) => {
  const row = buildRowObject(rawRow);
  const issues: string[] = [];

  const topic = trimCell(row.topic);
  const subtopic = trimCell(row.subtopic);
  const difficulty = trimCell(row.difficulty)?.toLowerCase();
  const questionText = trimCell(row.question);
  const questionImageSource = resolveImageSource(
    trimCell(row.question_image),
    zipFiles,
    issues,
    'Question'
  );
  const explanation = trimCell(row.explanation);
  const correctAnswer = trimCell(row.answer)?.toUpperCase();

  const options = OPTION_LETTERS.map((letter) => ({
    text: trimCell(row[letter.toLowerCase()]),
    imageSource: resolveImageSource(
      trimCell(row[`${letter.toLowerCase()}_image`]),
      zipFiles,
      issues,
      `Option ${letter}`
    ),
  }));

  const sanitized = sanitizeQuestionInput({
    topic,
    subtopic,
    difficulty,
    questionText,
    questionImage: questionImageSource ? '__IMAGE__' : undefined,
    options: options.map((option) => ({
      text: option.text,
      image: option.imageSource ? '__IMAGE__' : undefined,
    })),
    correctAnswer,
    explanation,
  });

  issues.push(...validateQuestionInput(sanitized));

  return {
    issues,
    draft: {
      rowNumber,
      topic: sanitized.topic,
      subtopic: sanitized.subtopic,
      difficulty: sanitized.difficulty,
      questionText: sanitized.questionText,
      questionImageSource,
      options,
      correctAnswer: sanitized.correctAnswer,
      explanation: sanitized.explanation,
    } satisfies DraftQuestion,
  };
};

const buildPreviewQuestion = async (draft: DraftQuestion) => {
  let questionImage: string | undefined;
  
  // Build preview image URL for question
  if (draft.questionImageSource) {
    try {
      questionImage =
        draft.questionImageSource.type === 'url'
          ? draft.questionImageSource.value
          : await buildPreviewImageUrl(draft.questionImageSource.file.buffer);
    } catch (err) {
      console.warn(`[Preview] Question image failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Build preview image URLs for options
  const options = await Promise.all(
    draft.options.map(async (option, index) => {
      let optionImage: string | undefined;
      
      if (option.imageSource) {
        try {
          optionImage =
            option.imageSource.type === 'url'
              ? option.imageSource.value
              : await buildPreviewImageUrl(option.imageSource.file.buffer);
        } catch (err) {
          const letter = ['A', 'B', 'C', 'D'][index] || `#${index}`;
          console.warn(`[Preview] Option ${letter} image failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      return {
        text: option.text,
        image: optionImage,
      };
    })
  );

  return {
    _id: `preview-row-${draft.rowNumber}`,
    topic: draft.topic || '',
    subtopic: draft.subtopic || '',
    difficulty: draft.difficulty || 'easy',
    questionText: draft.questionText,
    questionImage,
    options,
    correctAnswer: (draft.correctAnswer || 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: draft.explanation,
  };
};

const storeDraftQuestion = async (draft: DraftQuestion, req: Request) => {
  let questionImage: string | undefined;
  
  // Store question image if present
  if (draft.questionImageSource) {
    try {
      questionImage =
        draft.questionImageSource.type === 'url'
          ? draft.questionImageSource.value
          : await storeUploadedImage(draft.questionImageSource.file, req);
    } catch (err) {
      console.warn(`[Question] Image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Store option images if present
  const options = await Promise.all(
    draft.options.map(async (option, index) => {
      let optionImage: string | undefined;
      
      if (option.imageSource) {
        try {
          optionImage =
            option.imageSource.type === 'url'
              ? option.imageSource.value
              : await storeUploadedImage(option.imageSource.file, req);
        } catch (err) {
          const letter = ['A', 'B', 'C', 'D'][index] || `#${index}`;
          console.warn(`[Option ${letter}] Image upload failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      return {
        text: option.text,
        image: optionImage,
      };
    })
  );

  return {
    topic: draft.topic!,
    subtopic: draft.subtopic || '',
    difficulty: draft.difficulty!,
    questionText: draft.questionText,
    questionImage,
    options,
    correctAnswer: draft.correctAnswer!,
    explanation: draft.explanation || '',
  };
};

export const processBulkQuestionUpload = async ({
  workbookFile,
  imagesZipFile,
  mode,
  req,
}: {
  workbookFile: Express.Multer.File;
  imagesZipFile?: Express.Multer.File;
  mode: 'preview' | 'confirm';
  req: Request;
}): Promise<BulkUploadResult> => {
  const workbook = XLSX.read(workbookFile.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return {
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        savedRows: 0,
      },
      rows: [],
      questionIds: [],
    };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
    blankrows: true,
  });

  const zipFiles = buildZipFileMap(imagesZipFile);
  const filteredRows = rawRows
    .map((row, index) => ({
      row,
      rowNumber: index + 2,
    }))
    .filter(({ row }) => Object.values(row).some((value) => !isBlank(value)));

  const rows: BulkUploadRowResult[] = [];
  const validDrafts: DraftQuestion[] = [];

  for (const { row: rawRow, rowNumber } of filteredRows) {
    const { issues, draft } = buildDraftQuestion(rowNumber, rawRow, zipFiles);
    const isValid = issues.length === 0;

    if (isValid) {
      validDrafts.push(draft);
    }

    rows.push({
      rowNumber,
      status: isValid ? 'valid' : 'invalid',
      issues,
      question: isValid ? await buildPreviewQuestion(draft) : undefined,
    });
  }

  const invalidRows = rows.filter((row) => row.status === 'invalid').length;

  if (mode === 'confirm' && invalidRows === 0) {
    const questionsToSave = await Promise.all(
      validDrafts.map((draft) => storeDraftQuestion(draft, req))
    );
    const savedQuestions = await Question.insertMany(questionsToSave);

    return {
      summary: {
        totalRows: rows.length,
        validRows: validDrafts.length,
        invalidRows,
        savedRows: savedQuestions.length,
      },
      rows,
      questionIds: savedQuestions.map((question) => question._id.toString()),
      savedQuestions,
    };
  }

  return {
    summary: {
      totalRows: rows.length,
      validRows: validDrafts.length,
      invalidRows,
      savedRows: 0,
    },
    rows,
    questionIds: [],
  };
};
