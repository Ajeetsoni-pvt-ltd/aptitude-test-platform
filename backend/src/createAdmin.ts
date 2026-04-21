/**
 * createAdmin.ts
 * ─────────────────────────────────────────────────────────────
 * One-time script: Admin user create karo
 *
 * Run: npx ts-node src/createAdmin.ts
 *
 * Credentials:
 *   Email    : admin@nexus.io
 *   Password : Admin@1234
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';

const ADMIN_EMAIL    = 'admin@nexus.io';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'Super Admin';

const createAdmin = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // Check if admin already exists
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`ℹ️  Admin already exists: ${ADMIN_EMAIL}`);
    console.log(`   Role: ${existing.role}`);
    if (existing.role !== 'admin') {
      await User.updateOne({ email: ADMIN_EMAIL }, { role: 'admin' });
      console.log('   ✅ Role updated to admin');
    }
    await mongoose.disconnect();
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    collegeName: 'NEXUS Platform',
    branch: 'Administration',
    section: 'A',
    role: 'admin',
  });

  console.log('\n✅ Admin user created successfully!');
  console.log('─────────────────────────────────────');
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log(`  Role     : admin`);
  console.log('─────────────────────────────────────');
  console.log('⚠️  Change the password after first login!\n');

  await mongoose.disconnect();
  process.exit(0);
};

createAdmin().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
