// backend/src/models/ScheduledTest.ts
// Mongoose model for admin-created full-length scheduled tests

import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledTest extends Document {
  title:          string;
  topic:          string;
  difficulty:     'easy' | 'medium' | 'hard' | 'all';
  questionCount:  number;
  timeLimit:      number;        // in minutes
  startTime:      Date;
  assignedStudents: mongoose.Types.ObjectId[];
  createdBy:      mongoose.Types.ObjectId;
  status:         'locked' | 'live' | 'completed';
  uploadedQuestions?: string;    // reference to upload job / file path
  createdAt:      Date;
  updatedAt:      Date;
}

const scheduledTestSchema = new Schema<IScheduledTest>(
  {
    title: {
      type:     String,
      required: [true, 'Test title is required'],
      trim:     true,
    },
    topic: {
      type:     String,
      required: true,
      enum:     ['Quantitative Aptitude', 'Verbal Ability', 'Logical Reasoning'],
    },
    difficulty: {
      type:    String,
      enum:    ['easy', 'medium', 'hard', 'all'],
      default: 'all',
    },
    questionCount: {
      type:    Number,
      min:     5,
      max:     100,
      default: 30,
    },
    timeLimit: {
      type:    Number,
      min:     10,
      max:     180,
      default: 60,
    },
    startTime: {
      type:     Date,
      required: [true, 'Start time is required'],
    },
    assignedStudents: [
      {
        type: Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    status: {
      type:    String,
      enum:    ['locked', 'live', 'completed'],
      default: 'locked',
    },
    uploadedQuestions: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ── Virtual: derive real-time status from startTime ───────────────
scheduledTestSchema.virtual('currentStatus').get(function (this: IScheduledTest) {
  const now   = Date.now();
  const start = this.startTime.getTime();
  const end   = start + this.timeLimit * 60_000;
  if (now < start) return 'locked';
  if (now < end)   return 'live';
  return 'completed';
});

const ScheduledTest = mongoose.model<IScheduledTest>('ScheduledTest', scheduledTestSchema);
export default ScheduledTest;
