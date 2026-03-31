// backend/src/controllers/uploadController.ts
// ─────────────────────────────────────────────────────────────
// Upload Controller — .docx file se questions bulk import karo
// Flow: File receive → mammoth extract → parse → DB save → cleanup
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import fs from 'fs';
import mammoth from 'mammoth';
import Question from '../models/Question';
import asyncHandler from '../utils/asyncHandler';
import { parseQuestionsFromText } from '../utils/parseQuestions';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// ═══════════════════════════════════════════════════════════════
// @desc    Upload .docx file and bulk import questions
// @route   POST /api/upload/questions
// @access  Private → Admin only
// ═══════════════════════════════════════════════════════════════
export const uploadQuestions = asyncHandler(
  async (req: Request, res: Response) => {

    // ─── Step 1: File check karo ────────────────────────────
    // multer file upload kar chuka hoga req.file mein
    if (!req.file) {
      res.status(400).json(
        errorResponse('.docx file upload nahi hui. "file" field mein bhejo.')
      );
      return;
    }

    const filePath = req.file.path; // uploads/1234567890-questions.docx

    try {
      // ─── Step 2: mammoth se text extract karo ─────────────
      // extractRawText → pure plain text nikalta hai (formatting ignore) [web:71]
      // result.value → extracted text string
      // result.messages → warnings (if any formatting issues)
      console.log(`📄 File received: ${req.file.originalname}`);
      console.log(`📂 Saved at: ${filePath}`);

      const mammothResult = await mammoth.extractRawText({ path: filePath });
      const rawText = mammothResult.value;

      // Mammoth warnings log karo (useful for debugging)
      if (mammothResult.messages.length > 0) {
        console.warn('⚠️ Mammoth warnings:', mammothResult.messages);
      }

      // ─── Step 3: Text empty check ──────────────────────────
      if (!rawText || rawText.trim().length === 0) {
        res.status(400).json(
          errorResponse('File mein koi text nahi mila. File empty ya corrupt hai.')
        );
        return;
      }

      console.log(`📝 Extracted text length: ${rawText.length} chars`);

      // ─── Step 4: Parser se questions nikalo ────────────────
      const { questions, errors: parseErrors } = parseQuestionsFromText(rawText);

      console.log(`✅ Parsed questions: ${questions.length}`);
      console.log(`❌ Parse errors: ${parseErrors.length}`);

      // ─── Step 5: Koi bhi valid question nahi mila? ─────────
      if (questions.length === 0) {
        res.status(400).json(
          errorResponse(
            'Koi valid question parse nahi hua. Word file ka format check karo.\n' +
            'Errors: ' + parseErrors.join(' | ')
          )
        );
        return;
      }

      // ─── Step 6: MongoDB mein bulk insert karo ─────────────
      // insertMany → sab ek hi DB call mein save (efficient!) [web:86]
      // ordered: false → agar ek fail ho toh baaki continue karein
      // rawResult: true → insertedCount milega
      const insertResult = await Question.insertMany(questions, {
        ordered: false,  // Ek error aaye toh baaki save karte raho
      });

      const savedCount = insertResult.length;

      console.log(`💾 Questions saved to DB: ${savedCount}`);

      // ─── Step 7: File delete karo uploads/ se ──────────────
      // Kyun: Disk space waste nahi karna, file ka kaam ho gaya
      // fs.unlinkSync → file delete karo (sync version, error handle karein)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Temp file deleted: ${filePath}`);
      }

      // ─── Step 8: Response bhejo ────────────────────────────
      // Include question IDs from insertResult so frontend can link them to scheduled test
      const questionIds = insertResult.map((q: any) => q._id);
      
      res.status(201).json(
        successResponse(
          `🎉 Bulk import complete! ${savedCount} questions save ho gaye.`,
          {
            questionIds, // Array of saved question ObjectIds
            totalParsed: questions.length,
            savedCount,
            parseErrors:
              parseErrors.length > 0
                ? parseErrors
                : 'Koi parse error nahi — perfect file! ✅',
            sampleQuestion: questions[0], // Preview ke liye pehla question
          }
        )
      );

    } catch (error) {
      // ─── Error aaye toh bhi file delete karo ───────────────
      // Kyun: Try-catch ke bahar cleanupnahi hoga — isliye yahan explicitly
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Temp file cleaned up after error.');
      }
      // Error ko re-throw karo → asyncHandler → errorHandler pakdega
      throw error;
    }
  }
);

// ═══════════════════════════════════════════════════════════════
// @desc    Get upload instructions & Word file format template
// @route   GET /api/upload/template
// @access  Private → Admin only
// ═══════════════════════════════════════════════════════════════
export const getUploadTemplate = asyncHandler(
  async (_req: Request, res: Response) => {
    res.status(200).json(
      successResponse('Word file ka format yeh hona chahiye:', {
        instructions: [
          'Line 1: TOPIC: <topic name>',
          'Line 2: SUBTOPIC: <subtopic name>  (optional)',
          'Line 3: DIFFICULTY: easy / medium / hard',
          'Line 4: (blank)',
          'Line 5: Q1. <question text>',
          'Line 6: A) <option 1>',
          'Line 7: B) <option 2>',
          'Line 8: C) <option 3>',
          'Line 9: D) <option 4>',
          'Line 10: ANSWER: <A/B/C/D>',
          'Line 11: EXPLANATION: <explanation text>  (optional)',
          'Line 12: (blank)',
          'Line 13: Q2. <next question>...',
        ],
        example: {
          raw: `TOPIC: Quantitative Aptitude
SUBTOPIC: Percentage
DIFFICULTY: easy

Q1. Ek number ka 25% = 75 hai. Woh number kya hai?
A) 200
B) 300
C) 400
D) 500
ANSWER: B
EXPLANATION: 75 / 0.25 = 300`,
        },
        rules: [
          'Exactly 4 options hone chahiye (A, B, C, D)',
          'ANSWER mein sirf letter likhein (A/B/C/D)',
          'File .docx format mein honi chahiye (.doc nahi)',
          'Max file size: 5MB',
          'Ek file mein multiple topics ho sakti hain — Q1 ke baad ek naya TOPIC: likhein',
        ],
      })
    );
  }
);
