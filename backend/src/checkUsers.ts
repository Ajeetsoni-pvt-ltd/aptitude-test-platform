import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import User from './models/User';

async function check() {
  await mongoose.connect(process.env.MONGO_URI as string);
  const users = await User.find({}).select('name email role createdAt collegeName branch section').sort({ createdAt: -1 }).lean();
  console.log('\nTotal users in DB:', users.length);
  console.log('─────────────────────────────────────────────────────');
  users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email}`);
    console.log(`   Name    : ${u.name}`);
    console.log(`   Role    : ${u.role}`);
    console.log(`   College : ${u.collegeName}`);
    console.log(`   Branch  : ${u.branch} | Section: ${u.section}`);
    console.log(`   Created : ${new Date(u.createdAt).toLocaleString('en-IN')}`);
    console.log('');
  });
  await mongoose.disconnect();
}
check().catch(console.error);
