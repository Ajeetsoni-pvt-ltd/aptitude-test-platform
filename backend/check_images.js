require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./dist/models/Question').default;

(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/aptitude_test';
    console.log('Connecting to:', mongoUri.substring(0, 50) + '...');
    await mongoose.connect(mongoUri, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000 });
    
    const totalQuestions = await Question.countDocuments();
    console.log('Total questions:', totalQuestions);
    
    const withImages = await Question.countDocuments({ 
      $or: [
        { questionImage: { $ne: null, $ne: '' } },
        { 'options.image': { $ne: null, $ne: '' } }
      ]
    });
    console.log('Questions with at least one image:', withImages);
    
    const sampleWithImage = await Question.findOne({
      $or: [
        { questionImage: { $exists: true, $ne: null, $ne: '' } },
        { 'options.image': { $exists: true, $ne: null, $ne: '' } }
      ]
    });
    
    if (sampleWithImage) {
      console.log('\n=== Sample question with image ===');
      console.log('Question ID:', sampleWithImage._id);
      console.log('Question Text:', sampleWithImage.questionText?.substring(0, 50));
      console.log('Question Image:', sampleWithImage.questionImage);
      console.log('Option A:', sampleWithImage.options[0]?.text?.substring(0, 30), '| Image:', sampleWithImage.options[0]?.image);
      console.log('Option B:', sampleWithImage.options[1]?.text?.substring(0, 30), '| Image:', sampleWithImage.options[1]?.image);
      console.log('Option C:', sampleWithImage.options[2]?.text?.substring(0, 30), '| Image:', sampleWithImage.options[2]?.image);
      console.log('Option D:', sampleWithImage.options[3]?.text?.substring(0, 30), '| Image:', sampleWithImage.options[3]?.image);
    } else {
      console.log('\nNo questions found with images');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
