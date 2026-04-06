require('dotenv').config();
const mongoose = require('mongoose');
const ScheduledTest = require('./dist/models/ScheduledTest').default;

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    
    const tests = await ScheduledTest.find().lean();
    console.log(`Total tests: ${tests.length}\n`);
    
    tests.forEach((test, idx) => {
      if (!test.startTime || !test.endTime) {
        console.log(`Test ${idx}: ${test._id}`);
        console.log(`  Title: ${test.title}`);
        console.log(`  startTime: ${test.startTime}`);
        console.log(`  endTime: ${test.endTime}`);
        console.log();
      }
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
