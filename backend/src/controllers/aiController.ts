import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// Interface for chat messages
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

// Mock AI responses for aptitude questions
// In production, replace this with actual OpenAI API calls
const aptitudeResponses: { [key: string]: string } = {
  quantitative: `I'll help you with quantitative aptitude! Here are the key areas:
1. **Arithmetic**: Percentage, Profit-Loss, Simple/Compound Interest
2. **Algebra**: Equations, Inequalities, Functions
3. **Geometry**: Areas, Volumes, Angles
4. **Number Systems**: HCF, LCM, Prime Numbers
5. **Speed & Distance**: Time, Work, Pipes & Cistern

What specific topic would you like to work on?`,

  logical: `Great! Let me help with logical reasoning:
1. **Syllogism**: Venn diagrams, Logical statements
2. **Sequence Series**: Number patterns, Letter patterns
3. **Coding-Decoding**: Letter/Number shifts, Patterns
4. **Analogies**: Word relationships, Number relationships
5. **Blood Relations**: Family trees, Relationships

Which topic interests you?`,

  verbal: `Let's improve your verbal ability:
1. **Vocabulary**: Synonyms, Antonyms, Word meanings
2. **Reading Comprehension**: Understanding passages
3. **Grammar**: Sentence correction, Parts of speech
4. **Sentence Completion**: Fill in the blanks
5. **Error Spotting**: Identifying grammatical errors

What would you like to practice?`,

  default: `Hello! 🧠 I'm your AI Study Assistant. I can help you with:

**Quantitative Aptitude** - Math, Numbers, Calculations
**Logical Reasoning** - Patterns, Analogies, Deduction
**Verbal Ability** - English, Vocabulary, Grammar

Ask me any question or type:
- "quantitative" for math help
- "logical" for reasoning topics
- "verbal" for English help

What would you like to learn?`,
};

/**
 * POST /api/ai/chat
 * Chat with AI Study Assistant for aptitude preparation
 */
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  const { message, conversationHistory } = req.body;

  // Validate input
  if (!message || typeof message !== 'string') {
    res.status(400).json(
      errorResponse('Message is required and must be a string')
    );
    return;
  }

  const userMessage = message.toLowerCase().trim();

  // Determine response based on user input
  let reply = aptitudeResponses.default;

  if (userMessage.includes('quantitative') || userMessage.includes('math') || userMessage.includes('arithmetic')) {
    reply = aptitudeResponses.quantitative;
  } else if (userMessage.includes('logical') || userMessage.includes('reasoning') || userMessage.includes('pattern')) {
    reply = aptitudeResponses.logical;
  } else if (userMessage.includes('verbal') || userMessage.includes('english') || userMessage.includes('grammar')) {
    reply = aptitudeResponses.verbal;
  } else if (userMessage.includes('help') || userMessage.includes('hi') || userMessage.includes('hello')) {
    reply = aptitudeResponses.default;
  } else {
    // Default helpful response
    reply = `I understand you're asking: "${message}"\n\nTo get better help, please specify:\n- **Quantitative** topics (Math, Numbers)\n- **Logical** reasoning (Patterns, Puzzles)\n- **Verbal** ability (English, Grammar)\n\nWhich area would you like to focus on?`;
  }

  // Return response
  res.status(200).json(
    successResponse('Response generated successfully', { reply })
  );
});

/**
 * GET /api/ai/health
 * Check if AI service is available
 */
export const aiHealth = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(
    successResponse('AI service healthy', { status: 'AI service is operational' })
  );
});
