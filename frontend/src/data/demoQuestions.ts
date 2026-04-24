// src/data/demoQuestions.ts
// 10 Quantitative Aptitude demo questions — medium difficulty, ~60s each

export interface DemoQuestion {
  id: number;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  topic: string;
}

export const demoQuestions: DemoQuestion[] = [
  {
    id: 1,
    question:
      "A shopkeeper marks his goods 40% above the cost price and then offers a discount of 20%. What is his profit percentage?",
    options: ["10%", "12%", "15%", "20%"],
    correctIndex: 1,
    explanation:
      "Let CP = ₹100. Marked Price = ₹140. After 20% discount, SP = 140 × 0.80 = ₹112. Profit = 112 − 100 = ₹12, so profit % = 12%.",
    topic: "Profit & Loss",
  },
  {
    id: 2,
    question:
      "If the price of sugar increases by 25%, by what percentage should a household reduce its consumption so that the expenditure remains the same?",
    options: ["20%", "25%", "30%", "15%"],
    correctIndex: 0,
    explanation:
      "Reduction in consumption = (increase / (100 + increase)) × 100 = (25 / 125) × 100 = 20%.",
    topic: "Percentages",
  },
  {
    id: 3,
    question:
      "A can complete a work in 12 days and B can complete the same work in 18 days. If they work together, in how many days will the work be completed?",
    options: ["6.2 days", "7.2 days", "8 days", "9 days"],
    correctIndex: 1,
    explanation:
      "A's rate = 1/12, B's rate = 1/18. Combined rate = 1/12 + 1/18 = 5/36 per day. Time = 36/5 = 7.2 days.",
    topic: "Time & Work",
  },
  {
    id: 4,
    question:
      "A train 150 m long is running at 54 km/h. How long will it take to cross a platform 250 m long?",
    options: ["20 seconds", "24 seconds", "26.67 seconds", "30 seconds"],
    correctIndex: 2,
    explanation:
      "Speed = 54 km/h = 54 × 5/18 = 15 m/s. Total distance = 150 + 250 = 400 m. Time = 400 / 15 = 26.67 seconds.",
    topic: "Time, Speed & Distance",
  },
  {
    id: 5,
    question:
      "Find the simple interest on ₹8,000 at 12% per annum for 3 years.",
    options: ["₹2,400", "₹2,880", "₹3,200", "₹2,560"],
    correctIndex: 1,
    explanation:
      "SI = P × R × T / 100 = 8000 × 12 × 3 / 100 = ₹2,880.",
    topic: "Simple Interest",
  },
  {
    id: 6,
    question:
      "If A:B = 3:4 and B:C = 5:6, then what is A:B:C?",
    options: ["3:4:6", "15:20:24", "9:12:16", "5:6:8"],
    correctIndex: 1,
    explanation:
      "To combine, make B common: A:B = 3:4 = 15:20, B:C = 5:6 = 20:24. So A:B:C = 15:20:24.",
    topic: "Ratio & Proportion",
  },
  {
    id: 7,
    question:
      "The average of 5 numbers is 42. If one number is excluded, the average becomes 38. What is the excluded number?",
    options: ["50", "54", "58", "62"],
    correctIndex: 2,
    explanation:
      "Sum of 5 numbers = 5 × 42 = 210. Sum of remaining 4 = 4 × 38 = 152. Excluded number = 210 − 152 = 58.",
    topic: "Averages",
  },
  {
    id: 8,
    question:
      "What is the remainder when 2^256 is divided by 17?",
    options: ["0", "1", "2", "16"],
    correctIndex: 1,
    explanation:
      "By Fermat's little theorem, 2^16 ≡ 1 (mod 17). Since 256 = 16 × 16, we get 2^256 = (2^16)^16 ≡ 1^16 = 1 (mod 17).",
    topic: "Number System",
  },
  {
    id: 9,
    question:
      "A container has 60 litres of milk. 6 litres of milk is taken out and replaced with water. This process is repeated once more. How much milk is now in the container?",
    options: ["48 litres", "48.6 litres", "50.4 litres", "54 litres"],
    correctIndex: 1,
    explanation:
      "After each replacement, milk = initial × (1 − 6/60). After 2 replacements: 60 × (54/60)² = 60 × 0.81 = 48.6 litres.",
    topic: "Mixtures & Alligation",
  },
  {
    id: 10,
    question:
      "The present ages of A and B are in the ratio 5:3. After 6 years, their ages will be in the ratio 7:5. What is A's present age?",
    options: ["12 years", "15 years", "18 years", "20 years"],
    correctIndex: 1,
    explanation:
      "Let ages be 5x and 3x. After 6 years: (5x+6)/(3x+6) = 7/5. Cross multiply: 25x + 30 = 21x + 42 → 4x = 12 → x = 3. A's age = 5 × 3 = 15 years.",
    topic: "Ages",
  },
];
