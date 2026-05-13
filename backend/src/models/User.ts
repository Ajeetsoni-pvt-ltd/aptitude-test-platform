// src/models/User.ts
// ─────────────────────────────────────────────────────────────
// User Model — includes email verification & password reset fields
// ─────────────────────────────────────────────────────────────
import mongoose, { Schema, Document } from 'mongoose';

// User ka TypeScript interface (type safety ke liye)
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;         // yeh hashed hoga
  collegeName: string;
  branch: string;
  section: string;
  role: 'student' | 'admin';
  profilePicture?: string;  // URL to profile picture

  // ─── Email Verification Fields ──────────────────────────────
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;

  // ─── Password Reset Fields ─────────────────────────────────
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // security: password queries mein by default nahi aayega
    },
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      minlength: [2, 'College name must be at least 2 characters'],
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
      minlength: [2, 'Branch must be at least 2 characters'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
      minlength: [1, 'Section is required'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    profilePicture: {
      type: String,
      default: undefined,
    },

    // ─── Email Verification ──────────────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false, // sensitive field — don't expose in normal queries
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },

    // ─── Password Reset ──────────────────────────────────────
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true, // khud se createdAt aur updatedAt field add karega
  }
);

// ─── Indexes for fast token lookups ─────────────────────────
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

// Model export
const User = mongoose.model<IUser>('User', userSchema);

export default User;
