// backend/src/services/excelParsingService.ts
// Parse Excel files for full-length test creation with image support

import * as XLSX from 'xlsx';
import Question from '../models/Question';
import { IQuestion } from '../models/Question';

interface ExcelRow {
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  question?: string;
  question_image?: string;
  A?: string;
  A_image?: string;
  B?: string;
  B_image?: string;
  C?: string;
  C_image?: string;
  D?: string;
  D_image?: string;
  answer?: string;
  explanation?: string;
  [key: string]: any;
}

interface ParsedQuestion {
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText?: string;
  questionImage?: string;
  options: Array<{ text?: string; image?: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

interface ExcelParseResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  savedCount: number;
  questionIds: string[];
  questions: ParsedQuestion[];
  errors: Array<{ row: number; message: string }>;
}

/**
 * Convert Excel row to a Question object
 */
async function parseExcelRowToQuestion(row: ExcelRow, rowNumber: number): Promise<{
  success: boolean;
  question?: ParsedQuestion;
  error?: string;
}> {
  try {
    // Validate required fields
    const topic = row.topic?.toString().trim();
    const difficulty = row.difficulty?.toString().trim().toLowerCase();
    const questionText = row.question?.toString().trim() || '';
    const answerLetter = row.answer?.toString().trim().toUpperCase();

    if (!topic) return { success: false, error: `Row ${rowNumber}: Topic is required` };
    if (!['easy', 'medium', 'hard'].includes(difficulty || '')) {
      return { success: false, error: `Row ${rowNumber}: Difficulty must be easy, medium, or hard` };
    }
    if (!['A', 'B', 'C', 'D'].includes(answerLetter || '')) {
      return { success: false, error: `Row ${rowNumber}: Answer must be A, B, C, or D` };
    }
    if (!questionText && !row.question_image) {
      return { success: false, error: `Row ${rowNumber}: Question must have text or image` };
    }

    // Build options
    const options: Array<{ text?: string; image?: string }> = [];
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    for (const letter of optionLetters) {
      const optionText = row[letter]?.toString().trim();
      const optionImageUrl = row[`${letter}_image`]?.toString().trim();

      if (!optionText && !optionImageUrl) {
        return { success: false, error: `Row ${rowNumber}: Option ${letter} must have text or image` };
      }

      options.push({
        text: optionText || undefined,
        image: optionImageUrl || undefined,
      });
    }

    // Build the parsed question
    const question: ParsedQuestion = {
      topic,
      subtopic: row.subtopic?.toString().trim() || undefined,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      questionText: questionText || undefined,
      questionImage: row.question_image?.toString().trim() || undefined,
      options,
      correctAnswer: answerLetter as 'A' | 'B' | 'C' | 'D',
      explanation: row.explanation?.toString().trim() || undefined,
    };

    return { success: true, question };
  } catch (error) {
    return { success: false, error: `Row ${rowNumber}: ${(error as Error).message}` };
  }
}

/**
 * Parse Excel file and create questions in database
 */
export async function parseExcelAndCreateQuestions(filePath: string): Promise<ExcelParseResult> {
  const result: ExcelParseResult = {
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    savedCount: 0,
    questionIds: [],
    questions: [],
    errors: [],
  };

  try {
    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in Excel file');
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    result.totalRows = rows.length;

    // Parse each row
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      const row = rows[i];

      const parseResult = await parseExcelRowToQuestion(row, rowNumber);

      if (!parseResult.success) {
        result.invalidRows++;
        result.errors.push({ row: rowNumber, message: parseResult.error || 'Unknown error' });
        continue;
      }

      result.validRows++;
      const question = parseResult.question!;
      result.questions.push(question);

      // Create question in DB
      try {
        const createdQuestion = await Question.create({
          topic: question.topic,
          subtopic: question.subtopic || '',
          difficulty: question.difficulty,
          questionText: question.questionText,
          questionImage: question.questionImage,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          isTestExclusive: true,
        });

        result.questionIds.push(createdQuestion._id.toString());
        result.savedCount++;
      } catch (dbError) {
        result.invalidRows++;
        result.errors.push({
          row: rowNumber,
          message: `Failed to save to database: ${(dbError as Error).message}`,
        });
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Excel parsing failed: ${(error as Error).message}`);
  }
}

/**
 * Validate Excel structure before parsing
 */
export function validateExcelStructure(filePath: string): { valid: boolean; message?: string } {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return { valid: false, message: 'No sheets found in file' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];

    const requiredColumns = [
      'topic', 'difficulty', 'question', 'A', 'B', 'C', 'D', 'answer'
    ];

    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return {
        valid: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, message: `File validation failed: ${(error as Error).message}` };
  }
}

export async function getExcelPreview(filePath: string, maxRows: number = 5): Promise<{
  headers: string[];
  sample: ExcelRow[];
}> {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
  const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
  const sample = rows.slice(0, maxRows);

  return { headers, sample };
}
