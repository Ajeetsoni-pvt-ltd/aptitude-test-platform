type ChatRole = 'user' | 'ai';

export interface TutorChatMessage {
  role: ChatRole;
  content: string;
}

interface TutorResponse {
  reply: string;
  model: string;
  topic: string;
  attempts: number;
}

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
  };
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-2.5-flash-lite')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean);
const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const MIN_QUALITY_CHARS = 700;
const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_CHARS = 1200;

const APTITUDE_TOPICS = [
  'arithmetic',
  'percentage',
  'profit and loss',
  'ratio and proportion',
  'time and work',
  'time speed distance',
  'probability',
  'permutation and combination',
  'number system',
  'simplification',
  'algebra',
  'geometry',
  'trigonometry',
  'data interpretation',
  'mensuration',
  'statistics',
  'logical reasoning',
  'puzzle',
  'coding',
  'dsa',
  'sql',
  'dbms',
  'oops',
  'operating system',
];

const topicPatterns: Array<[string, RegExp]> = [
  ['Percentage', /\b(percent|percentage|%|discount|increase|decrease)\b/i],
  ['Profit and Loss', /\b(profit|loss|cost price|selling price|marked price|cp|sp)\b/i],
  ['Ratio and Proportion', /\b(ratio|proportion|share|mixture|alligation)\b/i],
  ['Time and Work', /\b(work|worker|pipe|cistern|days to complete|efficiency)\b/i],
  ['Time, Speed and Distance', /\b(speed|distance|train|boat|stream|relative speed|km\/h|m\/s)\b/i],
  ['Probability', /\b(probability|chance|dice|coin|cards?|random)\b/i],
  ['Permutation and Combination', /\b(permutation|combination|arrange|select|ways|ncr|npr)\b/i],
  ['Number System', /\b(hcf|lcm|prime|divisibility|remainder|digits?|unit digit)\b/i],
  ['Algebra', /\b(algebra|equation|quadratic|linear|polynomial|x\^|solve for x)\b/i],
  ['Geometry and Mensuration', /\b(area|volume|circle|triangle|rectangle|cone|sphere|cylinder|perimeter)\b/i],
  ['Trigonometry', /\b(sin|cos|tan|trigonometry|theta)\b/i],
  ['Data Interpretation', /\b(table|chart|graph|pie chart|bar graph|data interpretation|di)\b/i],
  ['Statistics', /\b(mean|median|mode|variance|standard deviation|average)\b/i],
  ['Logical Reasoning', /\b(reasoning|syllogism|blood relation|direction|series|analogy|coding decoding|puzzle)\b/i],
  ['DSA and Competitive Programming', /\b(dsa|algorithm|data structure|complexity|leetcode|competitive programming|codeforces)\b/i],
  ['C++ Programming', /\b(c\+\+|cpp|stl|pointer|reference|template)\b/i],
  ['SQL and DBMS', /\b(sql|dbms|database|join|normalization|transaction|index)\b/i],
  ['OOPs', /\b(oops|oop|object oriented|inheritance|polymorphism|encapsulation|abstraction)\b/i],
  ['Operating System', /\b(operating system|os|process|thread|deadlock|paging|semaphore)\b/i],
];

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const detectTopic = (message: string) => {
  const match = topicPatterns.find(([, pattern]) => pattern.test(message));
  return match?.[0] || 'General Placement Preparation';
};

const looksLikeProblemSolving = (message: string) => {
  const hasNumbersOrCode = /(\d|```|#include|SELECT|function|class\s+\w+)/i.test(message);
  const asksToSolve = /\b(solve|find|calculate|answer|explain|prove|derive|debug|write code|query|program)\b/i.test(message);
  return hasNumbersOrCode || asksToSolve;
};

const buildSystemPrompt = () => `
You are AptitudeMaster AI, a rigorous placement-preparation tutor for aptitude, reasoning, mathematics, coding, DBMS, SQL, OOPs, OS, and interview preparation.

Core behavior:
- Give complete, high-quality, educational answers. Never reply with a shallow one-liner unless the user explicitly asks for a one-line answer.
- Think carefully before answering, but do not reveal hidden chain-of-thought. Provide clear, student-friendly solution reasoning instead.
- Automatically identify the topic and the best solving approach.
- If a question is ambiguous or missing data, ask a concise clarifying question before solving. If a reasonable assumption is safe, state it and continue.
- Be accurate with arithmetic, units, formulas, edge cases, and final conclusions.
- Before finalizing, internally verify calculations, formula use, and logical consistency.
- For placement prep, explain in a way a student can reuse in exams and interviews.

Mandatory format for problem-solving questions:
## Problem Understanding
Briefly restate what is asked and identify the topic.

## Concept Used
List the formula, theorem, data structure, algorithm, SQL idea, or reasoning rule used.

## Step-by-Step Solution
Show the work clearly. Use numbered steps and calculations. For code, include approach, complexity, and clean code.

## Final Answer
Give the answer separately and unambiguously.

## Shortcut/Trick
Include a shortcut if useful. If no shortcut applies, say "No reliable shortcut; use the standard method."

For non-problem questions:
- Use clear headings, compact examples, and practical guidance.
- For study plans, give day-wise or topic-wise structure.
- For interview questions, include concise definitions, examples, common pitfalls, and likely follow-ups.

Quality rules:
- Minimum useful detail: explain why each important step is valid.
- Do not hallucinate facts. If unsure, say what assumption is being made.
- Preserve the user's language style when practical, but keep technical terms precise.
- Use Markdown. Keep formulas readable using plain text, e.g. Work = Rate x Time.
- Avoid unnecessary emojis and filler.
`;

const buildContextPrompt = (history: TutorChatMessage[] = []) => {
  const compactHistory = history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => `${entry.role === 'ai' ? 'Assistant' : 'User'}: ${truncate(entry.content, MAX_MESSAGE_CHARS)}`)
    .join('\n\n');

  return compactHistory
    ? `Recent conversation context:\n${compactHistory}`
    : 'Recent conversation context: none';
};

const buildUserPrompt = (message: string, history: TutorChatMessage[] = []) => {
  const topic = detectTopic(message);
  const problemSolving = looksLikeProblemSolving(message);

  return `
${buildContextPrompt(history)}

Detected topic hint: ${topic}
Likely task type: ${problemSolving ? 'problem-solving' : 'conceptual/tutoring'}

Student question:
${message}

Answer requirements:
- If this is a math, aptitude, reasoning, coding, SQL, DBMS, OOPs, OS, or interview problem, follow the mandatory problem-solving format exactly.
- Verify calculations and logic before writing the final answer.
- If the prompt is too ambiguous to solve, ask the minimum clarifying question needed.
- Prefer depth and correctness over brevity.
`;
};

const buildRepairPrompt = (message: string, firstReply: string, topic: string) => `
The previous answer was too short or incomplete for a serious placement-preparation tutor.

Original student question:
${message}

Detected topic: ${topic}

Previous answer:
${firstReply}

Rewrite it into a complete, accurate, structured answer. Include:
1. Problem Understanding
2. Concept Used
3. Step-by-Step Solution
4. Final Answer
5. Shortcut/Trick when applicable

Double-check calculations and avoid unsupported claims.
`;

const extractText = (data: GeminiResponse) => {
  if (data.error?.message) {
    throw new Error(data.error.message);
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error(`Gemini returned an empty response (${data.candidates?.[0]?.finishReason || 'unknown reason'}).`);
  }

  return text;
};

const callGemini = async (prompt: string, apiKey: string, model = DEFAULT_MODEL) => {
  const response = await fetch(`${GEMINI_ENDPOINT(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: buildSystemPrompt() }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: Number(process.env.GEMINI_TEMPERATURE ?? 0.25),
        topP: Number(process.env.GEMINI_TOP_P ?? 0.9),
        topK: Number(process.env.GEMINI_TOP_K ?? 40),
        maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 4096),
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini request failed with status ${response.status}.`);
  }

  return extractText(data);
};

const shouldRepairResponse = (reply: string, message: string) => {
  if (looksLikeProblemSolving(message) && reply.length < MIN_QUALITY_CHARS) return true;
  if (looksLikeProblemSolving(message) && !/final answer/i.test(reply)) return true;
  if (/step[- ]?by[- ]?step|solve|calculate|find/i.test(message) && !/concept used|step/i.test(reply)) return true;
  return false;
};

export const generateTutorResponse = async (
  message: string,
  conversationHistory: TutorChatMessage[] = []
): Promise<TutorResponse> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = DEFAULT_MODEL;
  const topic = detectTopic(message);

  if (!apiKey) {
    console.error('[gemini:tutor] GEMINI_API_KEY is missing from environment. AI chat will fail.');
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in the backend environment.');
  }

  console.log('[gemini:tutor] Request received', { topic, model, messageLength: message.length });

  const prompt = buildUserPrompt(message, conversationHistory);
  let attempts = 0;
  let lastError: Error | null = null;

  const modelCandidates = Array.from(new Set([model, ...FALLBACK_MODELS]));

  for (const modelCandidate of modelCandidates) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      attempts += 1;
      try {
        let reply = await callGemini(prompt, apiKey, modelCandidate);

        if (shouldRepairResponse(reply, message)) {
          attempts += 1;
          reply = await callGemini(buildRepairPrompt(message, reply, topic), apiKey, modelCandidate);
        }

        return { reply, model: modelCandidate, topic, attempts };
      } catch (error) {
        lastError = error as Error;
        const canTryNextModel = /not found|not supported|404/i.test(lastError.message);
        console.error('[gemini:tutor:error]', {
          attempt,
          model: modelCandidate,
          topic,
          message: lastError.message,
        });

        if (canTryNextModel) break;
      }
    }
  }

  throw lastError || new Error('Gemini failed to generate a response.');
};
