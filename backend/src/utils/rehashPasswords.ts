/**
 * rehashPasswords.ts
 * ─────────────────────────────────────────────────────────────
 * One-time migration script: plain-text passwords ko bcrypt hash mein convert karo
 *
 * Run: npx ts-node src/utils/rehashPasswords.ts
 *
 * Yeh script:
 *  1. Sabhi users fetch karta hai (password field ke saath)
 *  2. Check karta hai ki password already hashed hai ya nahi
 *  3. Agar plain-text hai toh hash karke save karta hai
 *
 * Safe to run multiple times — already hashed passwords skip ho jaate hain
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const isBcryptHash = (value: string): boolean =>
  /^\$2[aby]\$\d{2}\$/.test(value);

const rehash = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // password field select: false hai schema mein, isliye explicitly select karo
  const users = await User.find({}).select('+password').lean();
  console.log(`📋 Total users found: ${users.length}`);

  let skipped = 0;
  let updated = 0;
  let errors = 0;

  for (const user of users) {
    if (!user.password) {
      console.warn(`⚠️  User ${user.email} has no password — skipping`);
      skipped++;
      continue;
    }

    if (isBcryptHash(user.password)) {
      // Already hashed — skip
      skipped++;
      continue;
    }

    // Plain-text password detected — hash it
    try {
      const hashed = await bcrypt.hash(user.password, 10);
      await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
      console.log(`🔐 Rehashed password for: ${user.email}`);
      updated++;
    } catch (err) {
      console.error(`❌ Failed to rehash for ${user.email}:`, err);
      errors++;
    }
  }

  console.log('\n─── Summary ───────────────────────────────');
  console.log(`✅ Already hashed / skipped : ${skipped}`);
  console.log(`🔐 Rehashed                 : ${updated}`);
  console.log(`❌ Errors                   : ${errors}`);
  console.log('───────────────────────────────────────────');

  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected. Done!');
  process.exit(0);
};

rehash().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
