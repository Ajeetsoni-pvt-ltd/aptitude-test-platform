// src/models/TestAttempt.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

interface IAnswer {
  question: Types.ObjectId;      // Question model se reference
  selectedOption: string;
  isCorrect: boolean;
  timeSpent: number;             // seconds mein
}

export interface ITestAttempt extends Document {
  user: Types.ObjectId;
  testType: 'topic-wise' | 'subtopic-wise' | 'full-mock' | 'custom';
  title?: string;                // jaise "Mock Test 1" ya "Custom: Quant + Reasoning"
  questions: Types.ObjectId[];   // is test mein kaunse questions the
  answers: IAnswer[];            // user ne kya jawab diye
  score: number;
  totalQuestions: number;
  correct: number;
  incorrect: number;
  skipped: number;
  totalTime: number;             // total seconds
  topicPerformance?: Map<string, { correct: number; total: number }>; // topic-wise stats
  createdAt: Date;
  completedAt?: Date;
}

const testAttemptSchema = new Schema<ITestAttempt>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    testType: {
      type: String,
      enum: ['practice', 'mock', 'sectional', 'full', 'custom'],
      
      required: true,
    },
    title: {
      type: String,
      trim: true,
    },
    questions: [{
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    }],
    answers: [{
      question: { type: Schema.Types.ObjectId, ref: 'Question' },
      selectedOption: String,
      isCorrect: Boolean,
      timeSpent: Number,
    }],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    totalTime: { type: Number },
    topicPerformance: {
      type: Map,
      of: {
        correct: Number,
        total: Number,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITestAttempt>('TestAttempt', testAttemptSchema);