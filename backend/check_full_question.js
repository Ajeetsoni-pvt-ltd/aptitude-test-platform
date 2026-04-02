require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./dist/models/Question').default;

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aptitude_test';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000 });
    
    const question = await Question.findOne({
      questionImage: { $exists: true, $ne: null, $ne: '' }
    });
    
    if (question) {
      console.log('\n=== Full Question Document ===\n');
      console.log(JSON.stringify(question.toObject(), null, 2));
    } else {
      console.log('No question found with questionImage');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
