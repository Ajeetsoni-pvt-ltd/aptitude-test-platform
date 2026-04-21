import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import generateToken from '../utils/generateToken';
import { successResponse, errorResponse } from '../utils/ApiResponse';

const normalizeEmail = (email: unknown) =>
  typeof email === 'string' ? email.toLowerCase().trim() : '';

const normalizeTextField = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const logAuthDebug = (context: string, payload: Record<string, unknown>) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.info(`[auth:${context}]`, payload);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { password, role } = req.body;
  const name = normalizeTextField(req.body.name);
  const email = normalizeEmail(req.body.email);
  const collegeName = normalizeTextField(req.body.collegeName);
  const branch = normalizeTextField(req.body.branch);
  const section = normalizeTextField(req.body.section);

  logAuthDebug('register-request', {
    email,
    hasName: Boolean(name),
    hasPassword: Boolean(password),
    hasCollegeName: Boolean(collegeName),
    hasBranch: Boolean(branch),
    hasSection: Boolean(section),
  });

  if (!name || !email || !password || !collegeName || !branch || !section) {
    res.status(400).json(
      errorResponse('Name, email, password, college name, branch aur section required hain.')
    );
    return;
  }

  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json(errorResponse('Password kam se kam 6 characters ka hona chahiye.'));
    return;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res
      .status(400)
      .json(errorResponse('Yeh email already registered hai. Login karo ya alag email use karo.'));
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    collegeName,
    branch,
    section,
    role: role === 'admin' ? 'admin' : 'student',
  });

  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
  });

  res.status(201).json(
    successResponse('Registration successful! Welcome to Aptitude Test Platform.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        branch: user.branch,
        section: user.section,
        role: user.role,
      },
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body.email);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  logAuthDebug('login-request', {
    email,
    hasPassword: Boolean(password),
  });

  if (!email || !password) {
    res.status(400).json(errorResponse('Email aur password dono required hain.'));
    return;
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.warn('[auth:login-user-not-found]', { email });
    res.status(401).json(errorResponse('Email ya password galat hai.'));
    return;
  }

  if (!user.password) {
    console.warn('[auth:login-missing-password-hash]', {
      email,
      userId: user._id.toString(),
    });
    res.status(401).json(errorResponse('Email ya password galat hai.'));
    return;
  }

  // Detect plain-text password in DB (migration needed)
  const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password);
  if (!isBcryptHash) {
    console.error('[auth:login-plain-text-password-detected]', {
      email,
      userId: user._id.toString(),
      hint: 'Run: npx ts-node src/utils/rehashPasswords.ts to fix this',
    });
    res.status(401).json(
      errorResponse(
        'Account password format outdated. Please contact admin to reset your password.'
      )
    );
    return;
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    console.warn('[auth:login-password-mismatch]', {
      email,
      userId: user._id.toString(),
    });
    res.status(401).json(errorResponse('Email ya password galat hai.'));
    return;
  }

  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
  });

  res.status(200).json(
    successResponse('Login successful! Welcome back.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        collegeName: user.collegeName,
        branch: user.branch,
        section: user.section,
        role: user.role,
      },
    })
  );
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.id);

  if (!user) {
    res.status(404).json(errorResponse('User not found.'));
    return;
  }

  res.status(200).json(
    successResponse('User profile fetched successfully.', {
      _id: user._id,
      name: user.name,
      email: user.email,
      collegeName: user.collegeName,
      branch: user.branch,
      section: user.section,
      role: user.role,
      createdAt: user.createdAt,
    })
  );
});
