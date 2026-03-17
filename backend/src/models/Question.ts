// src/models/Question.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion extends Document {
  topic: string;
  subtopic: string;
  concept?: string;
  questionText: string;
  options: string[];                // ["A. Option text", "B. Option text", ...]
  correctAnswer: string;            // "A" ya "B" ya pura option text
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    topic: {
      type: String,
      required: [true, 'Topic daalna zaroori hai'],
      trim: true,
      index: true,                // fast search ke liye
    },
    subtopic: {
      type: String,
      required: [true, 'Subtopic daalna zaroori hai'],
      trim: true,
      index: true,
    },
    concept: {
      type: String,
      trim: true,
    },
    questionText: {
      type: String,
      required: [true, 'Question text zaroori hai'],
    },
    options: {
      type: [String],
      required: [true, 'Kam se kam 2 options chahiye'],
      minlength: 2,
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer daalna zaroori hai'],
    },
    explanation: {
      type: String,
      required: [true, 'Explanation daalna zaroori hai'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
  },
  {
    timestamps: true,
  }
);

// Fast filtering ke liye compound index
questionSchema.index({ topic: 1, subtopic: 1, difficulty: 1 });

export default mongoose.model<IQuestion>('Question', questionSchema);