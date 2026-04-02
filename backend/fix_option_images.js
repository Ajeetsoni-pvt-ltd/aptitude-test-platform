#!/usr/bin/env node

/**
 * Script to Fix Option Images in Existing Questions
 * 
 * This script adds the image field to options in questions that have questionImage.
 * It enables option images for future questions by ensuring the schema properly handles the image field.
 * 
 * Usage: node fix_option_images.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Question = require('./dist/models/Question').default;

async function fixOptionImages() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable not set');
      process.exit(1);
    }

    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { maxPoolSize: 1 });

    // Find all questions to check their structure
    const allQuestions = await Question.find({});
    console.log(`\n📊 Total questions in database: ${allQuestions.length}`);

    // Count questions with questionImage
    const withQuestionImage = allQuestions.filter(q => q.questionImage).length;
    console.log(`📷 Questions with question image: ${withQuestionImage}`);

    // Count questions with option images
    const withOptionImages = allQuestions.filter(q => 
      q.options && q.options.some(opt => opt && opt.image)
    ).length;
    console.log(`🖼️  Questions with option images: ${withOptionImages}`);

    // Show sample of a question with question image but no option images
    const sampleWithQuestionImg = await Question.findOne({
      questionImage: { $exists: true, $ne: null, $ne: '' }
    });

    if (sampleWithQuestionImg) {
      console.log('\n📋 Sample Question with Image Issue:');
      console.log('   ID:', sampleWithQuestionImg._id);
      console.log('   Question Image:', sampleWithQuestionImg.questionImage ? 'YES ✓' : 'NO ❌');
      console.log('   Option Images:', sampleWithQuestionImg.options?.some(o => o?.image) ? 'YES ✓' : 'NO ❌');
      console.log('   Options:', JSON.stringify(sampleWithQuestionImg.options, null, 2));
    }

    // Ensure all options have both text and image fields (even if image is undefined/null)
    // This ensures the field structure is consistent
    let updateCount = 0;
    for (const question of allQuestions) {
      let hasEmptyImageField = false;
      
      if (question.options && Array.isArray(question.options)) {
        for (const option of question.options) {
          if (option && typeof option === 'object' && !('image' in option)) {
            hasEmptyImageField = true;
            break;
          }
        }
      }

      // If any option is missing the image field, we should ensure it's there
      if (hasEmptyImageField) {
        const updatedOptions = question.options.map(opt => ({
          text: opt ? opt.text : undefined,
          image: opt && opt.image ? opt.image : undefined,
        }));
        
        await Question.updateOne(
          { _id: question._id },
          { $set: { options: updatedOptions } }
        );
        updateCount++;
      }
    }

    if (updateCount > 0) {
      console.log(`\n✅ Updated ${updateCount} documents to ensure consistent option field structure`);
    } else {
      console.log('\n✅ All documents already have consistent option field structure');
    }

    console.log('\n📝 NOTE: For future uploads with option images:');
    console.log('   1. Create an Excel file with columns: A_image, B_image, C_image, D_image');
    console.log('   2. Enter image file names (e.g., "image1.png")');
    console.log('   3. Create a ZIP file with all matching image files');
    console.log('   4. Upload both files and images will be properly linked to options');

    await mongoose.connection.close();
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixOptionImages();
