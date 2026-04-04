import mongoose, { Document, Schema } from 'mongoose';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
export type CorrectAnswer = (typeof OPTION_LETTERS)[number];

export interface IQuestionOption {
  text?: string;
  image?: string;
}

export interface IQuestion extends Document {
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText?: string;
  questionImage?: string;
  options: IQuestionOption[];
  correctAnswer: CorrectAnswer;
  explanation?: string;
  isTestExclusive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const optionSchema = new Schema<IQuestionOption>(
  {
    text: {
      type: String,
      trim: true,
      default: undefined,
    },
    image: {
      type: String,
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

const questionSchema = new Schema<IQuestion>(
  {
    topic: {
      type: String,
      required: [true, 'Topic is required.'],
      trim: true,
      index: true,
    },
    subtopic: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: [true, 'Difficulty is required.'],
      index: true,
    },
    questionText: {
      type: String,
      trim: true,
      default: undefined,
    },
    questionImage: {
      type: String,
      default: undefined,
    },
    options: {
      type: [optionSchema],
      required: [true, 'Exactly 4 options are required.'],
      default: [],
    },
    correctAnswer: {
      type: String,
      enum: OPTION_LETTERS,
      required: [true, 'Correct answer is required.'],
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
    },
    isTestExclusive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.pre('validate', function (next) {
  const hasQuestionText = Boolean(this.questionText?.trim());
  const hasQuestionImage = Boolean(this.questionImage?.trim());

  if (!hasQuestionText && !hasQuestionImage) {
    this.invalidate(
      'questionText',
      'Question must include questionText, questionImage, or both.'
    );
  }

  if (!Array.isArray(this.options) || this.options.length !== OPTION_LETTERS.length) {
    this.invalidate('options', 'Exactly 4 options are required.');
    return next();
  }

  this.options.forEach((option, index) => {
    const hasText = Boolean(option?.text?.trim());
    const hasImage = Boolean(option?.image?.trim());

    if (!hasText && !hasImage) {
      this.invalidate(
        `options.${index}.text`,
        `Option ${OPTION_LETTERS[index]} must include text, image, or both.`
      );
    }
  });

  next();
});

questionSchema.index({ topic: 1, subtopic: 1, difficulty: 1 });

export default mongoose.model<IQuestion>('Question', questionSchema);
