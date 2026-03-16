// src/config/db.ts
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // process.env.MONGO_URI se .env file ka connection string le rahe hain
    const conn = await mongoose.connect(process.env.MONGO_URI as string, {
      // Yeh options modern MongoDB ke liye recommended hain
      serverSelectionTimeoutMS: 5000, // 5 seconds mein connect nahi hua to error
    });

    console.log(`MongoDB Connected Successfully!`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB Connection Error:`, (error as Error).message);
    // Agar connection fail ho to server band kar denge (development mein safe hai)
    process.exit(1);
  }
};

export default connectDB;