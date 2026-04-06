require('dotenv').config();
const mongoose = require('mongoose');
const ScheduledTest = require('./dist/models/ScheduledTest').default;

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aptitude_test';
    await mongoose.connect(mongoUri);
    
    const tests = await ScheduledTest.find().lean();
    console.log(`Found ${tests.length} scheduled tests`);
    if (tests.length > 0) {
      console.log('\nFirst test:', JSON.stringify(tests[0], null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
    process.exit(1);
  }
})();
