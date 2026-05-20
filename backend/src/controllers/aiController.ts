import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import { generateTutorResponse, TutorChatMessage } from '../services/geminiTutor.service';

const MAX_MESSAGE_LENGTH = 8000;

const getSafeAiError = (message: string) => {
  if (message.includes('GEMINI_API_KEY') || message.includes('API key')) {
    return {
      status: 503,
      text: 'AI service is not configured. Please set GEMINI_API_KEY on the backend.',
    };
  }

  if (/not found|not supported|404/i.test(message)) {
    return {
      status: 502,
      text: 'The configured Gemini model is unavailable. Update GEMINI_MODEL to gemini-2.5-flash or another supported Gemini model.',
    };
  }

  if (/quota|rate limit|429/i.test(message)) {
    return {
      status: 429,
      text: 'Gemini rate limit or quota was reached. Please wait a moment and try again.',
    };
  }

  return {
    status: 502,
    text: 'AI service could not generate a reliable response right now. Please try again.',
  };
};

const sanitizeHistory = (history: unknown): TutorChatMessage[] => {
  if (!Array.isArray(history)) return [];

  return history
    .filter((entry): entry is TutorChatMessage => {
      const candidate = entry as Partial<TutorChatMessage>;
      return (
        (candidate.role === 'user' || candidate.role === 'ai') &&
        typeof candidate.content === 'string' &&
        candidate.content.trim().length > 0
      );
    })
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim(),
    }));
};

/**
 * POST /api/ai/chat
 * Chat with Gemini-powered placement preparation tutor.
 */
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json(errorResponse('Message is required and must be a string.'));
    return;
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    res.status(413).json(errorResponse(`Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`));
    return;
  }

  try {
    const result = await generateTutorResponse(trimmedMessage, sanitizeHistory(conversationHistory));

    res.status(200).json(
      successResponse('Response generated successfully.', {
        reply: result.reply,
        model: result.model,
        topic: result.topic,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI response generation failed.';
    const safeError = getSafeAiError(message);
    console.error('[ai:chat:error]', { message });

    res.status(safeError.status).json(errorResponse(safeError.text));
  }
});

/**
 * GET /api/ai/health
 * Check if AI service is configured.
 */
export const aiHealth = asyncHandler(async (_req: Request, res: Response) => {
  const configured = Boolean(process.env.GEMINI_API_KEY?.trim());
  const payload = {
      configured,
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
      status: configured ? 'Gemini tutor is configured.' : 'GEMINI_API_KEY is missing.',
  };

  res.status(configured ? 200 : 503).json(
    configured
      ? successResponse('AI service health checked.', payload)
      : errorResponse('AI service is not configured.')
  );
});
