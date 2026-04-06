// backend/src/controllers/aiController.ts
// AI Chat Controller — Google Gemini integration with user context

import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';
import TestAttempt from '../models/TestAttempt';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert AI Study Assistant for an aptitude test preparation platform focused on Indian competitive exams like TCS NQT, Infosys InfyTQ, Wipro NLTH, campus placements, and government exams.

Your role:
1. Answer aptitude questions clearly with step-by-step solutions
2. Explain mathematical concepts simply with examples
3. Provide study plans and strategies
4. Analyze performance data and suggest improvements
5. Help with Quantitative Aptitude, Logical Reasoning, Verbal Ability, Data Interpretation

Guidelines:
- Keep responses concise and structured
- Use markdown formatting for clarity
- For math problems, show step-by-step working
- Be encouraging and motivating
- If user has weak areas, proactively suggest practice
- Format numbers and formulas clearly
- Limit response to 300 words unless detailed explanation is needed`;

// ─────────────────────────────────────────────────────────────
// @desc    Chat with Gemini AI
// @route   POST /api/ai/chat
// @access  Private
// ─────────────────────────────────────────────────────────────
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationHistory } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json(errorResponse('Message is required.'));
    return;
  }

  if (message.trim().length > 1000) {
    res.status(400).json(errorResponse('Message too long. Keep it under 1000 characters.'));
    return;
  }

  // ── Fetch user context ──────────────────────────────────────
  let userContext = '';
  try {
    const recentAttempts = await TestAttempt.find({ user: req.user!.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('score correctCount incorrectCount topicPerformance totalTime totalQuestions title')
      .lean();

    if (recentAttempts.length > 0) {
      const avgScore = Math.round(recentAttempts.reduce((s, a) => s + a.score, 0) / recentAttempts.length);
      const bestScore = Math.max(...recentAttempts.map((a) => a.score));

      // Topic aggregation
      const topicMap: Record<string, { correct: number; total: number }> = {};
      recentAttempts.forEach((a) => {
        if (a.topicPerformance) {
          Object.entries(a.topicPerformance as Record<string, { correct: number; total: number }>).forEach(([topic, perf]) => {
            if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
            topicMap[topic].correct += perf.correct;
            topicMap[topic].total   += perf.total;
          });
        }
      });

      const topicScores = Object.entries(topicMap)
        .map(([topic, perf]) => ({
          topic,
          score: Math.round((perf.correct / (perf.total || 1)) * 100),
        }))
        .sort((a, b) => a.score - b.score);

      const weakTopics  = topicScores.slice(0, 2).map((t) => `${t.topic} (${t.score}%)`).join(', ');
      const strongTopics = topicScores.slice(-2).map((t) => `${t.topic} (${t.score}%)`).join(', ');

      userContext = `
USER PERFORMANCE CONTEXT:
- Tests taken: ${recentAttempts.length} (recently)
- Average score: ${avgScore}%
- Best score: ${bestScore}%
- Weak areas: ${weakTopics || 'Not enough data'}
- Strong areas: ${strongTopics || 'Not enough data'}
- Recent test: "${recentAttempts[0]?.title || 'Practice Test'}" with score ${recentAttempts[0]?.score}%
Use this context to personalize your response. Recommend practice in weak areas.`;
    }
  } catch {
    // Context fetch failed silently — still answer
  }

  // ── Build conversation history ──────────────────────────────
  const history = Array.isArray(conversationHistory)
    ? conversationHistory.slice(-6).map((msg: { role: string; content: string }) => ({
        role:  msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))
    : [];

  // ── Combine system prompt with user context ──────────────
  const fullSystemPrompt = SYSTEM_PROMPT + (userContext ? '\n\n' + userContext : '');
  
  // ── For the first message, include system prompt inline ──
  // Note: Gemini 2.5+ API doesn't use system_instruction field in the same way
  let contents: any[] = [];
  
  if (history.length === 0) {
    // First message - include system prompt with the user message
    const combinedText = fullSystemPrompt + '\n\n---\n\n' + message.trim();
    contents = [
      {
        role:  'user',
        parts: [{ text: combinedText }],
      },
    ];
  } else {
    // Subsequent messages - use normal history
    contents = [
      ...history,
      {
        role:  'user',
        parts: [{ text: message.trim() }],
      },
    ];
  }

  // ── Call Gemini API ─────────────────────────────────────────
  try {
    const response = await fetch(GEMINI_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        contents,
        generationConfig: {
          temperature:     0.7,
          topK:            40,
          topP:            0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[AI] Gemini error:', err);
      res.status(502).json(errorResponse('AI service temporarily unavailable. Please try again.'));
      return;
    }

    const data: any = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      res.status(502).json(errorResponse('No response from AI. Please try again.'));
      return;
    }

    res.status(200).json(successResponse('AI response ready.', { reply: text.trim() }));
  } catch (error) {
    console.error('[AI] Fetch error:', error);
    res.status(502).json(errorResponse('Failed to reach AI service. Please check your connection.'));
  }
});
