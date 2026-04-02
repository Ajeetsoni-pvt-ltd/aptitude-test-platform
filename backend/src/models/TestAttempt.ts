import mongoose, { Document, Schema, Types } from 'mongoose';

interface IAnswer {
  question: Types.ObjectId;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface ITestAttempt extends Document {
  user: Types.ObjectId;
  testType: 'practice' | 'mock' | 'sectional' | 'full' | 'custom';
  title?: string;
  questions: Types.ObjectId[];
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalTime: number;
  topicPerformance?: Map<string, { correct: number; total: number }>;
  scheduledTest?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
    ],
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: 'Question' },
        selectedAnswer: String,
        isCorrect: Boolean,
        timeSpent: Number,
      },
    ],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    correctCount: { type: Number, default: 0 },
    incorrectCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    topicPerformance: {
      type: Map,
      of: {
        correct: Number,
        total: Number,
      },
      default: {},
    },
    scheduledTest: {
      type: Schema.Types.ObjectId,
      ref: 'ScheduledTest',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITestAttempt>('TestAttempt', testAttemptSchema);
