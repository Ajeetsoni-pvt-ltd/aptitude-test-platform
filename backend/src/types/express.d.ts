// backend/src/types/express.d.ts
// ─────────────────────────────────────────────────────────────
// TypeScript Declaration Merging: Express Request type extend kar rahe hain
// Kyun: JWT middleware req.user set karega — TypeScript ko batana padega
// Yeh sirf type information hai — runtime pe koi effect nahi
// ─────────────────────────────────────────────────────────────

// Express module ke namespace mein add kar rahe hain
declare namespace Express {
  interface Request {
    user?: {
      id: string;          // MongoDB ObjectId (string form)
      role: 'student' | 'admin';  // User role (User.ts model se same)
    };
  }
}
