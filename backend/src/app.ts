// backend/src/app.ts
// ─────────────────────────────────────────────────────────────
// Express Application Configuration
// app.ts = middleware + routes setup (server start NAHI hota yahan)
// Reason: Testing ke liye app ko server se alag rakhte hain
// ─────────────────────────────────────────────────────────────
import errorHandler from './middlewares/errorHandler';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import testRoutes from './routes/testRoutes';
const app: Application = express();

// ─── Security Middleware ───────────────────────────────────────
// helmet: Sets secure HTTP response headers (XSS, clickjacking protection)
app.use(helmet());

// cors: Allow requests from React frontend (localhost:5173 in dev)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────
// Prevent brute-force attacks: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter); // Only apply to /api routes

// ─── Request Parsing Middleware ────────────────────────────────
app.use(express.json({ limit: '10mb' }));           // Parse JSON body
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded body

// ─── HTTP Request Logger ───────────────────────────────────────
// morgan 'dev' mode: coloured logs in terminal → [GET] /api/auth/login 200 12ms
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check Route ────────────────────────────────────────
// Simple route to verify server is running (used by DevOps/monitoring tools)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '✅ Aptitude Test Platform API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);           // ✅ Step 3 LIVE
app.use('/api/questions', questionRoutes);  // Step 5 mein fill hoga
app.use('/api/tests', testRoutes);          // Step 6 mein fill hoga


// ─── 404 Handler ──────────────────────────────────────────────
// Yeh tab chalega jab koi route match na ho
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '🚫 Route not found. Please check the API endpoint.',
  });
});

// ─── Global Error Handler ──────────────────────────────────────
// Express ka built-in error handler override karte hain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(errorHandler);

export default app;
