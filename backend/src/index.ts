// src/index.ts (temporary test file)
import dotenv from 'dotenv';
import connectDB from './config/db';

// .env file ko load karo
dotenv.config();

console.log('Starting MongoDB connection test...');

// Connection call karo
connectDB();