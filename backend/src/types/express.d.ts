// backend/src/types/express.d.ts
// ─────────────────────────────────────────────────────────────
// Express Request type extension — Declaration Merging
// Kyun: JWT middleware req.user set karega
// TypeScript ko pehle se batana padta hai ki 'user' property exist karegi
//
// 'declare global' → globally Express namespace extend kar raha hai
// 'export {}' → is file ko TypeScript "module" samjhe (required for global)
// ─────────────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;                   // MongoDB _id (string form)
        role: 'student' | 'admin';    // User.ts model se same values
      };
    }
  }
}

// Yeh line zaroori hai — file ko TypeScript module banata hai
// Bina iske 'declare global' kaam nahi karega
export {};
