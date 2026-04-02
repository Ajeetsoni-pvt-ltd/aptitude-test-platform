// backend/src/models/ScheduledTest.ts
// Mongoose model for admin-created full-length scheduled tests

import mongoose, { Document, Schema } from 'mongoose';

export interface IScheduledTest extends Document {
  title:          string;
  testCode:       string;                       // Slug/code (auto-generated, editable)
  topic:          string;
  difficulty:     'easy' | 'medium' | 'hard' | 'all';
  questionCount:  number;
  timeLimit:      number;                      // in minutes
  startTime:      Date;
  endTime:        Date;                        // When test expires/becomes unavailable
  oneAttemptOnly: boolean;                     // Only one attempt per student
  sendNotification: boolean;                   // Send notification to students
  assignedStudents: mongoose.Types.ObjectId[];
  createdBy:      mongoose.Types.ObjectId;
  status:         'locked' | 'live' | 'completed';
  customQuestions?: mongoose.Types.ObjectId[];
  createdAt:      Date;
  updatedAt:      Date;
}

// Helper function to generate test code from title
function generateTestCode(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .substring(0, 50);

  return slug || `test-${Date.now()}`;
}

const scheduledTestSchema = new Schema<IScheduledTest>(
  {
    title: {
      type:     String,
      required: [true, 'Test title is required'],
      trim:     true,
    },
    testCode: {
      type:     String,
      unique:   true,
      sparse:   true,
      trim:     true,
      index:    true,
    },
    topic: {
      type:     String,
      required: true,
      trim:     true,
    },
    difficulty: {
      type:    String,
      enum:    ['easy', 'medium', 'hard', 'all'],
      default: 'all',
    },
    questionCount: {
      type:    Number,
      min:     1,
      default: 30,
    },
    timeLimit: {
      type:    Number,
      min:     1,
      default: 60,
    },
    startTime: {
      type:     Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type:     Date,
      required: [true, 'End time is required'],
    },
    oneAttemptOnly: {
      type:    Boolean,
      default: true,
    },
    sendNotification: {
      type:    Boolean,
      default: true,
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
    customQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
  },
  { timestamps: true }
);

// ── Pre-save hook: Generate testCode if not provided ───────────
scheduledTestSchema.pre('save', async function(next) {
  if (this.testCode) {
    next();
    return;
  }

  const ScheduledTestModel = this.constructor as mongoose.Model<IScheduledTest>;
  const baseCode = generateTestCode(this.title);
  let candidate = baseCode;
  let suffix = 1;

  while (
    await ScheduledTestModel.exists({
      testCode: candidate,
      _id: { $ne: this._id },
    })
  ) {
    const suffixToken = `-${suffix}`;
    candidate = `${baseCode.substring(0, 50 - suffixToken.length)}${suffixToken}`;
    suffix += 1;
  }

  this.testCode = candidate;
  next();
});

// ── Virtual: derive real-time status from startTime/endTime ─────
scheduledTestSchema.virtual('currentStatus').get(function (this: IScheduledTest) {
  const now   = Date.now();
  const start = this.startTime.getTime();
  const end   = this.endTime.getTime();
  if (now < start) return 'locked';
  if (now < end)   return 'live';
  return 'completed';
});

const ScheduledTest = mongoose.model<IScheduledTest>('ScheduledTest', scheduledTestSchema);
export default ScheduledTest;
