import type { Question } from '@/types';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export const getOptionLetter = (index: number) => OPTION_LETTERS[index] ?? 'A';

export const getAssetUrl = (url?: string) => {
  if (!url) {
    return undefined;
  }

  if (/^(https?:|data:|blob:)/i.test(url)) {
    return url;
  }

  const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
  const serverBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase.replace(/\/api\/?$/, '');

  return new URL(url.startsWith('/') ? url : `/${url}`, `${serverBase}/`).toString();
};

export const questionHasImage = (question: Pick<Question, 'questionImage'>) =>
  Boolean(question.questionImage);

export const questionHasOptionImages = (question: Pick<Question, 'options'>) =>
  question.options.some((option) => Boolean(option.image));
