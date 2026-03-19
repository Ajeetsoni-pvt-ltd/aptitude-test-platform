// backend/src/controllers/authController.ts
// ─────────────────────────────────────────────────────────────
// Auth Controller: Register + Login + GetMe
// Kyun controller alag: Business logic routes se alag rahega
// asyncHandler: try-catch automatically handle hoga
// ─────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import asyncHandler from '../utils/asyncHandler';
import generateToken from '../utils/generateToken';
import { successResponse, errorResponse } from '../utils/ApiResponse';

// ═══════════════════════════════════════════════════════════════
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (koi bhi call kar sakta hai — login ki zaroorat nahi)
// ═══════════════════════════════════════════════════════════════
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Step 1: Request body se data nikalo
  const { name, email, password, role } = req.body;

  // Step 2: Required fields check karo
  if (!name || !email || !password) {
    res.status(400).json(errorResponse('Name, email aur password required hain.'));
    return;
  }

  // Step 3: Password minimum length check
  if (password.length < 6) {
    res.status(400).json(errorResponse('Password kam se kam 6 characters ka hona chahiye.'));
    return;
  }

  // Step 4: Email already exist karti hai? (duplicate check)
  // Kyun: MongoDB pe bhi unique index hai — lekin pehle yahan check karo
  // taaki clear error message de sakein
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400).json(errorResponse('Yeh email already registered hai. Login karo ya alag email use karo.'));
    return;
  }

  // Step 5: Password hash karo (bcrypt saltRounds = 12)
  // saltRounds 10-12 ideal hai: security aur speed ka balance
  // 10 → fast but less secure | 14 → very secure but slow
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Step 6: User MongoDB mein save karo
  // Note: role 'admin' sirf allowed users ke liye — warna default 'student'
  const user = await User.create({
    name,
    email: email.toLowerCase(), // hamesha lowercase mein store karo
    password: hashedPassword,   // plain password KABHI nahi, sirf hash
    role: role === 'admin' ? 'admin' : 'student', // safety check
  });

  // Step 7: JWT token generate karo
  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
  });

  // Step 8: Response bhejo (password field include mat karo!)
  res.status(201).json(
    successResponse('Registration successful! Welcome to Aptitude Test Platform.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  );
});








// ═══════════════════════════════════════════════════════════════
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ═══════════════════════════════════════════════════════════════
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Step 1: Request body se email aur password nikalo
  const { email, password } = req.body;

  // Step 2: Required fields check
  if (!email || !password) {
    res.status(400).json(errorResponse('Email aur password dono required hain.'));
    return;
  }

  // Step 3: User dhundo DB mein
  // .select('+password') → kyunki User model mein password: select:false hai
  // Bina iske password field nahi aayega → bcrypt compare fail hoga
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Step 4: User exist nahi karta
  // Security tip: "Email ya password galat hai" — alag-alag mat batao
  // Kyun? Attacker ko pata nahi chalna chahiye ki email exist karti hai ya nahi
  if (!user) {
    res.status(401).json(errorResponse('Email ya password galat hai.'));
    return;
  }

  // Step 5: Password compare karo
  // bcrypt.compare(plain, hashed) → true ya false return karta hai
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    res.status(401).json(errorResponse('Email ya password galat hai.'));
    return;
  }

  // Step 6: JWT Token generate karo
  const token = generateToken({
    id: user._id.toString(),
    role: user.role,
  });

  // Step 7: Successful login response
  res.status(200).json(
    successResponse('Login successful! Welcome back.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  );
});


// ═══════════════════════════════════════════════════════════════
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private (token required — Step 4 mein protect middleware add karenge)
// ═══════════════════════════════════════════════════════════════
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  // req.user → Step 4 mein JWT middleware set karega
  // Abhi placeholder hai — Step 4 ke baad kaam karega
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
      role: user.role,
      createdAt: user.createdAt,
    })
  );
});
