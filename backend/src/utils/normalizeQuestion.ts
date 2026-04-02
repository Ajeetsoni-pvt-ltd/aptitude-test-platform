import { OPTION_LETTERS, type CorrectAnswer, type IQuestionOption } from '../models/Question';

type QuestionLike = {
  toObject?: () => Record<string, unknown>;
};

export interface NormalizedQuestion extends Record<string, unknown> {
  _id: string | { toString(): string };
  topic: string;
  subtopic: string;
  difficulty?: string;
  questionText?: string;
  questionImage?: string;
  options: IQuestionOption[];
  correctAnswer?: CorrectAnswer;
  explanation: string;
}

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeQuestionOption = (
  option: unknown,
  legacyImage?: unknown
): IQuestionOption => {
  if (typeof option === 'string') {
    return {
      text: normalizeOptionalString(option),
      image: normalizeOptionalString(legacyImage),
    };
  }

  if (option && typeof option === 'object') {
    const optionRecord = option as Record<string, unknown>;

    return {
      text: normalizeOptionalString(optionRecord.text),
      image:
        normalizeOptionalString(optionRecord.image) ??
        normalizeOptionalString(optionRecord.imageUrl) ??
        normalizeOptionalString(legacyImage),
    };
  }

  return {
    text: undefined,
    image: normalizeOptionalString(legacyImage),
  };
};

const normalizeCorrectAnswer = (
  value: unknown,
  options: IQuestionOption[]
): CorrectAnswer | undefined => {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return undefined;
  }

  const upper = normalized.toUpperCase();

  if (OPTION_LETTERS.includes(upper as CorrectAnswer)) {
    return upper as CorrectAnswer;
  }

  const prefixLetterMatch = upper.match(/^([A-D])(?:[\).\s-]|$)/);
  if (prefixLetterMatch) {
    return prefixLetterMatch[1] as CorrectAnswer;
  }

  const optionImageMatch = upper.match(/\[?OPTION(?:[_\s-]+IMAGE)?[_\s-]+([A-D])\]?/i);
  if (optionImageMatch) {
    return optionImageMatch[1].toUpperCase() as CorrectAnswer;
  }

  const matchingOptionIndex = options.findIndex(
    (option) => option.text?.toLowerCase() === normalized.toLowerCase()
  );

  if (matchingOptionIndex >= 0) {
    return OPTION_LETTERS[matchingOptionIndex];
  }

  return undefined;
};

export const normalizeQuestion = (question: unknown): NormalizedQuestion => {
  const questionLike = (question || {}) as QuestionLike;
  const source =
    typeof questionLike.toObject === 'function'
      ? questionLike.toObject()
      : ((question || {}) as Record<string, unknown>);
  const questionRecord = { ...source } as Record<string, unknown>;
  const rawOptions = Array.isArray(questionRecord.options) ? questionRecord.options : [];
  const legacyOptionImages = Array.isArray(questionRecord.optionImageUrls)
    ? questionRecord.optionImageUrls
    : [];

  const options = OPTION_LETTERS.map((_, index) =>
    normalizeQuestionOption(rawOptions[index], legacyOptionImages[index])
  );

  const normalizedQuestion = {
    ...questionRecord,
    _id: (questionRecord._id as NormalizedQuestion['_id']) || '',
    topic: normalizeOptionalString(questionRecord.topic) || '',
    subtopic: normalizeOptionalString(questionRecord.subtopic) || '',
    difficulty: normalizeOptionalString(questionRecord.difficulty),
    questionText: normalizeOptionalString(questionRecord.questionText),
    questionImage:
      normalizeOptionalString(questionRecord.questionImage) ??
      normalizeOptionalString(questionRecord.questionImageUrl),
    options,
    correctAnswer: normalizeCorrectAnswer(questionRecord.correctAnswer, options),
    explanation: normalizeOptionalString(questionRecord.explanation) || '',
  };

  delete (normalizedQuestion as Record<string, unknown>).questionImageUrl;
  delete (normalizedQuestion as Record<string, unknown>).optionImageUrls;

  return normalizedQuestion as NormalizedQuestion;
};

export const normalizeQuestions = (questions: unknown[] = []) =>
  questions.map((question) => normalizeQuestion(question));
