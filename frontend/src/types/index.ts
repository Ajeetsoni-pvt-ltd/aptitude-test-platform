export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface QuestionOption {
  text?: string;
  image?: string;
}

export interface Question {
  _id: string;
  topic: string;
  subtopic?: string;
  questionText?: string;
  questionImage?: string;
  options: QuestionOption[];
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestAttempt {
  _id: string;
  title: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalTime: number;
  topicPerformance: Record<string, { correct: number; total: number }>;
  createdAt: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
