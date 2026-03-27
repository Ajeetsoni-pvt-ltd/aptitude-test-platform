// backend/src/seed.ts
// ─────────────────────────────────────────────────────────────
// Seed Script — Sample questions DB mein daalega
// Run: npx ts-node src/seed.ts
// ─────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Question from './models/Question';

const sampleQuestions = [
  // ─── Quantitative Aptitude ─────────────────────────────────
  {
    topic: 'Quantitative Aptitude', subtopic: 'Percentage', concept: 'Basic',
    questionText: 'Ek number ka 25% = 75 hai. Woh number kya hai?',
    options: ['200', '300', '400', '500'],
    correctAnswer: '300',
    explanation: '75 / 0.25 = 300',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Percentage', concept: 'Basic',
    questionText: '40 ka 15% kya hoga?',
    options: ['4', '6', '8', '10'],
    correctAnswer: '6',
    explanation: '40 × 15/100 = 6',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Percentage', concept: 'Discount',
    questionText: 'Rs. 500 ki item pe 20% discount ke baad price kya hogi?',
    options: ['Rs. 350', 'Rs. 375', 'Rs. 400', 'Rs. 425'],
    correctAnswer: 'Rs. 400',
    explanation: '500 - (500 × 20/100) = 500 - 100 = 400',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Simple Interest', concept: 'Basic',
    questionText: 'Rs. 1000 pe 5% annual rate se 3 saal ka simple interest kya hoga?',
    options: ['Rs. 100', 'Rs. 150', 'Rs. 200', 'Rs. 250'],
    correctAnswer: 'Rs. 150',
    explanation: 'SI = (1000 × 5 × 3) / 100 = 150',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Ratio', concept: 'Basic',
    questionText: 'A aur B ka ratio 3:5 hai. Agar A = 60 hai toh B kya hai?',
    options: ['80', '90', '100', '120'],
    correctAnswer: '100',
    explanation: '3/5 = 60/B → B = 100',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Time & Work', concept: 'Basic',
    questionText: 'A ek kaam 10 din mein karta hai, B 15 din mein. Saath mein kitne din lagenge?',
    options: ['4 din', '5 din', '6 din', '7 din'],
    correctAnswer: '6 din',
    explanation: '1/10 + 1/15 = 5/30 = 1/6 → 6 din',
    difficulty: 'medium',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Speed & Distance', concept: 'Basic',
    questionText: '60 km/h speed se 120 km ka safar kitne ghante mein hoga?',
    options: ['1 ghanta', '2 ghante', '3 ghante', '4 ghante'],
    correctAnswer: '2 ghante',
    explanation: 'Time = Distance/Speed = 120/60 = 2',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Profit & Loss', concept: 'Basic',
    questionText: 'Rs. 200 mein kharida, Rs. 250 mein becha. Profit % kya hai?',
    options: ['20%', '25%', '30%', '35%'],
    correctAnswer: '25%',
    explanation: 'Profit = 50, % = (50/200) × 100 = 25%',
    difficulty: 'easy',
  },

  // ─── Logical Reasoning ─────────────────────────────────────
  {
    topic: 'Logical Reasoning', subtopic: 'Series', concept: 'Number Series',
    questionText: '2, 4, 8, 16, ? — Agli number kya hogi?',
    options: ['24', '28', '30', '32'],
    correctAnswer: '32',
    explanation: 'Har number double hota hai: 16 × 2 = 32',
    difficulty: 'easy',
  },
  {
    topic: 'Logical Reasoning', subtopic: 'Series', concept: 'Number Series',
    questionText: '1, 4, 9, 16, 25, ? — Agli number kya hogi?',
    options: ['30', '35', '36', '49'],
    correctAnswer: '36',
    explanation: 'Squares hain: 1², 2², 3², 4², 5², 6² = 36',
    difficulty: 'easy',
  },
  {
    topic: 'Logical Reasoning', subtopic: 'Analogy', concept: 'Word Analogy',
    questionText: 'Doctor : Hospital :: Teacher : ?',
    options: ['Book', 'Student', 'School', 'Pen'],
    correctAnswer: 'School',
    explanation: 'Doctor Hospital mein kaam karta hai, Teacher School mein',
    difficulty: 'easy',
  },
  {
    topic: 'Logical Reasoning', subtopic: 'Coding-Decoding', concept: 'Basic',
    questionText: 'Agar CAT = 3120 toh DOG = ?',
    options: ['4157', '4156', '4158', '4155'],
    correctAnswer: '4157',
    explanation: 'D=4, O=15, G=7 → 4+15+7 = 26... (positional sum)',
    difficulty: 'medium',
  },
  {
    topic: 'Logical Reasoning', subtopic: 'Blood Relations', concept: 'Basic',
    questionText: 'A ki maa B ki beti hai. A ka B se kya rishta hai?',
    options: ['Beti', 'Behen', 'Nani', 'Mausi'],
    correctAnswer: 'Nani',
    explanation: 'A ki maa = B ki beti → A, B ki naani hai',
    difficulty: 'medium',
  },

  // ─── Verbal Ability ────────────────────────────────────────
  {
    topic: 'Verbal Ability', subtopic: 'Synonyms', concept: 'Vocabulary',
    questionText: '"Diligent" ka synonym kya hai?',
    options: ['Lazy', 'Hardworking', 'Careless', 'Slow'],
    correctAnswer: 'Hardworking',
    explanation: 'Diligent = Mehnat karne wala = Hardworking',
    difficulty: 'easy',
  },
  {
    topic: 'Verbal Ability', subtopic: 'Antonyms', concept: 'Vocabulary',
    questionText: '"Expand" ka antonym kya hai?',
    options: ['Grow', 'Increase', 'Contract', 'Enlarge'],
    correctAnswer: 'Contract',
    explanation: 'Expand = Badhna, Contract = Sikodhna (opposite)',
    difficulty: 'easy',
  },
  {
    topic: 'Verbal Ability', subtopic: 'Fill in the Blanks', concept: 'Grammar',
    questionText: 'She ___ to school every day.',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 'goes',
    explanation: 'She (singular) ke saath goes aata hai (present simple)',
    difficulty: 'easy',
  },
  {
    topic: 'Verbal Ability', subtopic: 'Synonyms', concept: 'Vocabulary',
    questionText: '"Benevolent" ka synonym kya hai?',
    options: ['Cruel', 'Kind', 'Selfish', 'Greedy'],
    correctAnswer: 'Kind',
    explanation: 'Benevolent = Dayalu = Kind',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Average', concept: 'Basic',
    questionText: '5 numbers ka average 20 hai. Unka sum kya hoga?',
    options: ['80', '90', '100', '110'],
    correctAnswer: '100',
    explanation: 'Sum = Average × Count = 20 × 5 = 100',
    difficulty: 'easy',
  },
  {
    topic: 'Quantitative Aptitude', subtopic: 'Percentage', concept: 'Advanced',
    questionText: 'Salary pehle 10% badhi, phir 10% ghati. Net change kya hua?',
    options: ['0%', '-1%', '+1%', '-2%'],
    correctAnswer: '-1%',
    explanation: '100 → 110 → 110 × 0.9 = 99 → Net change = -1%',
    difficulty: 'medium',
  },
  {
    topic: 'Logical Reasoning', subtopic: 'Direction', concept: 'Basic',
    questionText: 'Ram North face kar raha hai, phir 90° clockwise ghoomta hai. Ab kaunsi direction mein hai?',
    options: ['North', 'South', 'East', 'West'],
    correctAnswer: 'East',
    explanation: 'North se 90° clockwise = East',
    difficulty: 'easy',
  },
];

const seedDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) throw new Error('MONGO_URI .env mein nahi hai!');

    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected!');

    // Purane seed questions delete karo (dobara run karne pe duplicate na ho)
    await Question.deleteMany({});
    console.log('🗑️  Purane questions delete kiye');

    // Naye questions insert karo
    const inserted = await Question.insertMany(sampleQuestions);
    console.log(`🌱 ${inserted.length} sample questions successfully insert ho gaye!`);

    console.log('\n📊 Topic-wise breakdown:');
    const topics = [...new Set(sampleQuestions.map(q => q.topic))];
    for (const topic of topics) {
      const count = sampleQuestions.filter(q => q.topic === topic).length;
      console.log(`   ${topic}: ${count} questions`);
    }

  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB Disconnected. Seed complete!');
    process.exit(0);
  }
};

seedDB();
