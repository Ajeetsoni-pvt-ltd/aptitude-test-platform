import type { CorrectAnswer, IQuestionOption } from '../models/Question';
import { OPTION_LETTERS } from '../models/Question';

export interface QuestionInput {
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  questionText?: string;
  questionImage?: string;
  options?: IQuestionOption[];
  correctAnswer?: string;
  explanation?: string;
}

export interface SanitizedQuestionInput {
  topic?: string;
  subtopic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionText?: string;
  questionImage?: string;
  options: IQuestionOption[];
  correctAnswer?: CorrectAnswer;
  explanation?: string;
}

const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

const trimString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeDifficulty = (
  value: unknown
): SanitizedQuestionInput['difficulty'] | undefined => {
  const normalized = trimString(value)?.toLowerCase();
  if (!normalized || !DIFFICULTIES.has(normalized)) {
    return undefined;
  }

  return normalized as SanitizedQuestionInput['difficulty'];
};

const normalizeCorrectAnswer = (value: unknown): CorrectAnswer | undefined => {
  const normalized = trimString(value)?.toUpperCase();

  if (!normalized || !OPTION_LETTERS.includes(normalized as CorrectAnswer)) {
    return undefined;
  }

  return normalized as CorrectAnswer;
};

export const sanitizeQuestionInput = (input: QuestionInput): SanitizedQuestionInput => ({
  topic: trimString(input.topic),
  subtopic: trimString(input.subtopic) || '',
  difficulty: normalizeDifficulty(input.difficulty),
  questionText: trimString(input.questionText),
  questionImage: trimString(input.questionImage),
  options: Array.isArray(input.options)
    ? input.options.map((option) => ({
        text: trimString(option?.text),
        image: trimString(option?.image),
      }))
    : [],
  correctAnswer: normalizeCorrectAnswer(input.correctAnswer),
  explanation: trimString(input.explanation) || '',
});

export const validateQuestionInput = (input: SanitizedQuestionInput): string[] => {
  const issues: string[] = [];

  if (!input.topic) {
    issues.push('Topic is required.');
  }

  if (!input.difficulty) {
    issues.push('Difficulty must be easy, medium, or hard.');
  }

  if (!input.questionText && !input.questionImage) {
    issues.push('Question must have text or image.');
  }

  if (!Array.isArray(input.options) || input.options.length !== OPTION_LETTERS.length) {
    issues.push('Exactly 4 options are required.');
  } else {
    input.options.forEach((option, index) => {
      if (!option?.text && !option?.image) {
        issues.push(`Option ${OPTION_LETTERS[index]} must have text or image.`);
      }
    });
  }

  if (!input.correctAnswer) {
    issues.push('Correct answer must be one of A, B, C, or D.');
  }

  return issues;
};

export const parseOptionsPayload = (value: unknown): IQuestionOption[] | undefined => {
  if (Array.isArray(value)) {
    return value as IQuestionOption[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as IQuestionOption[]) : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
};
