// frontend/src/types/index.ts
// Global TypeScript Types — Poore frontend mein use honge

// ─── User Type ─────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  createdAt?: string;
}

// ─── Auth Response (Backend se aata hai) ──────────────────────
export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

// ─── Generic API Response ──────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// ─── Question Type ─────────────────────────────────────────────
export interface Question {
  _id: string;
  topic: string;
  subtopic: string;
  concept: string;
  questionText: string;
  options: string[];
  correctAnswer?: string; // Test ke waqt nahi aata
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Test Attempt Type ─────────────────────────────────────────
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

// ─── Form Types ────────────────────────────────────────────────
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
