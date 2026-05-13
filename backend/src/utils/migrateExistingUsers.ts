// backend/src/utils/migrateExistingUsers.ts
// ─────────────────────────────────────────────────────────────
// One-time Migration Script
// Sets isVerified=true for all existing users who don't have
// the field set, so they aren't locked out after the update.
//
// Run: npx ts-node src/utils/migrateExistingUsers.ts
// ─────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User';

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all users where isVerified is not set or is false
    const result = await User.updateMany(
      { isVerified: { $ne: true } },
      {
        $set: {
          isVerified: true,
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpiry: '',
        },
      }
    );

    console.log(`✅ Migration complete: ${result.modifiedCount} users marked as verified.`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', (error as Error).message);
    process.exit(1);
  }
};

migrate();
