// backend/src/utils/parseQuestions.ts
// ─────────────────────────────────────────────────────────────
// Word File Question Parser
// Input:  Raw text extracted from .docx file (mammoth se)
// Output: Array of question objects (MongoDB mein save karne ke liye)
//
// Expected Word File Format:
// TOPIC: Quantitative Aptitude
// SUBTOPIC: Percentage
// DIFFICULTY: easy
//
// Q1. Question text?
// A) Option 1
// B) Option 2
// C) Option 3
// D) Option 4
// ANSWER: B
// EXPLANATION: Explanation text
// ─────────────────────────────────────────────────────────────

// ─── Parsed Question ka TypeScript Type ───────────────────────
export interface ParsedQuestion {
  topic: string;
  subtopic: string;
  concept: string;
  questionText: string;
  options: string[];         // ["200", "300", "400", "500"]
  correctAnswer: string;     // "300" (actual option text, letter nahi)
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Parse Result Type ─────────────────────────────────────────
export interface ParseResult {
  questions: ParsedQuestion[];
  errors: string[];          // Kaunse questions parse nahi hue (with reason)
}

// ═══════════════════════════════════════════════════════════════
// Main Parser Function
// ═══════════════════════════════════════════════════════════════
export const parseQuestionsFromText = (rawText: string): ParseResult => {
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  // ─── Step 1: Text ko lines mein split karo ────────────────
  const lines = rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0); // Empty lines hata do

  // ─── Step 2: File-level metadata nikalo ───────────────────
  // TOPIC:, SUBTOPIC:, DIFFICULTY: → poori file ke liye default
  let defaultTopic = 'General';
  let defaultSubtopic = '';
  let defaultDifficulty: 'easy' | 'medium' | 'hard' = 'medium';

  for (const line of lines) {
    if (line.toUpperCase().startsWith('TOPIC:')) {
      defaultTopic = line.substring(6).trim();
    } else if (line.toUpperCase().startsWith('SUBTOPIC:')) {
      defaultSubtopic = line.substring(9).trim();
    } else if (line.toUpperCase().startsWith('DIFFICULTY:')) {
      const diff = line.substring(11).trim().toLowerCase();
      if (['easy', 'medium', 'hard'].includes(diff)) {
        defaultDifficulty = diff as 'easy' | 'medium' | 'hard';
      }
    }
  }

  // ─── Step 3: Questions identify karo ──────────────────────
  // "Q1.", "Q2.", "Q10." → Question start hota hai
  const questionStartRegex = /^Q\d+\./i;

  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  let optionMap: Record<string, string> = {}; // { A: "200", B: "300", ... }
  let questionIndex = 0;

  // ─── Helper: Current question save karo ───────────────────
  const saveCurrentQuestion = () => {
    if (!currentQuestion) return;
    questionIndex++;

    // Validation
    if (!currentQuestion.questionText) {
      errors.push(`Q${questionIndex}: Question text nahi mila.`);
      return;
    }
    if (currentOptions.length !== 4) {
      errors.push(
        `Q${questionIndex}: Exactly 4 options chahiye, mila ${currentOptions.length}.`
      );
      return;
    }
    if (!currentQuestion.correctAnswer) {
      errors.push(`Q${questionIndex}: ANSWER field nahi mila.`);
      return;
    }

    // correctAnswer letter (B) ko actual text (300) mein convert karo
    const answerLetter = currentQuestion.correctAnswer.toUpperCase();
    const answerText = optionMap[answerLetter];

    if (!answerText) {
      errors.push(
        `Q${questionIndex}: ANSWER "${currentQuestion.correctAnswer}" valid nahi hai (A/B/C/D mein se hona chahiye).`
      );
      return;
    }

    // ✅ Valid question — save karo
    questions.push({
      topic: defaultTopic,
      subtopic: defaultSubtopic,
      concept: '',
      questionText: currentQuestion.questionText,
      options: currentOptions,
      correctAnswer: answerText,   // Letter nahi, actual text save hoga
      explanation: currentQuestion.explanation || '',
      difficulty: defaultDifficulty,
    });
  };

  // ─── Step 4: Line by line parse karo ──────────────────────
  for (const line of lines) {
    // Nayi question shuru hoti hai?
    if (questionStartRegex.test(line)) {
      // Pehle wali question save karo (agar hai)
      if (currentQuestion) {
        saveCurrentQuestion();
      }
      // Nayi question initialize karo
      currentQuestion = {};
      currentOptions = [];
      optionMap = {};
      // "Q1. Question text yahan hai?" → "Question text yahan hai?"
      currentQuestion.questionText = line.replace(/^Q\d+\.\s*/i, '').trim();

    } else if (/^[A-D]\)/i.test(line) && currentQuestion) {
      // Option line: "A) Option text" ya "B) Option text"
      const letter = line[0].toUpperCase();       // "A"
      const optionText = line.substring(2).trim(); // "200"
      optionMap[letter] = optionText;
      currentOptions.push(optionText);

    } else if (line.toUpperCase().startsWith('ANSWER:') && currentQuestion) {
      // "ANSWER: B" → "B"
      currentQuestion.correctAnswer = line.substring(7).trim();

    } else if (line.toUpperCase().startsWith('EXPLANATION:') && currentQuestion) {
      // "EXPLANATION: Yeh reason hai" → "Yeh reason hai"
      currentQuestion.explanation = line.substring(12).trim();
    }
  }

  // ─── Step 5: Last question bhi save karo ──────────────────
  // Loop ke baad last question save hona baaki hota hai
  if (currentQuestion && currentQuestion.questionText) {
    saveCurrentQuestion();
  }

  return { questions, errors };
};
