// src/models/User.ts
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
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Naam daalna zaroori hai'],
      trim: true,
      minlength: [2, 'Naam kam se kam 2 letters ka hona chahiye'],
    },
    email: {
      type: String,
      required: [true, 'Email daalna zaroori hai'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Sahih email format daalo'],
    },
    password: {
      type: String,
      required: [true, 'Password daalna zaroori hai'],
      minlength: [6, 'Password kam se kam 6 characters ka hona chahiye'],
      select: false, // security: password queries mein by default nahi aayega
    },
    collegeName: {
      type: String,
      required: [true, 'College name daalna zaroori hai'],
      trim: true,
      minlength: [2, 'College name kam se kam 2 characters ka hona chahiye'],
    },
    branch: {
      type: String,
      required: [true, 'Branch daalna zaroori hai'],
      trim: true,
      minlength: [2, 'Branch kam se kam 2 characters ka hona chahiye'],
    },
    section: {
      type: String,
      required: [true, 'Section daalna zaroori hai'],
      trim: true,
      minlength: [1, 'Section daalna zaroori hai'],
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
  },
  {
    timestamps: true, // khud se createdAt aur updatedAt field add karega
  }
);

// Model export
const User = mongoose.model<IUser>('User', userSchema);

export default User;
