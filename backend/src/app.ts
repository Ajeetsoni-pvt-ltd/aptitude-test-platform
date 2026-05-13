// backend/src/app.ts
// ─────────────────────────────────────────────────────────────
// Express Application Configuration — Production Hardened
// ─────────────────────────────────────────────────────────────
import errorHandler from './middlewares/errorHandler';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import questionRoutes from './routes/questionRoutes';
import testRoutes from './routes/testRoutes';
import adminRoutes from './routes/adminRoutes';
import scheduledTestRoutes from './routes/scheduledTestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import aiRoutes from './routes/aiRoutes';

const app: Application = express();
const isProduction = process.env.NODE_ENV === 'production';

// ─── Trust Proxy (REQUIRED for Docker/Nginx) ──────────────────
// Nginx sets X-Forwarded-For, X-Forwarded-Proto headers.
// Without this: rate limiter sees Nginx IP (not client IP),
// req.protocol is always 'http', secure cookies won't set.
app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  // Allow inline styles for email templates preview (dev only)
  contentSecurityPolicy: isProduction ? undefined : false,
  // HSTS: tell browsers to always use HTTPS (production only)
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

// ─── CORS Configuration ───────────────────────────────────────
// Production: uses CORS_ORIGINS or CLIENT_URL from .env.production
// Development: falls back to localhost
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  process.env.CLIENT_URL ||
  'http://localhost:5173'
).split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, health checks)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[cors:blocked] origin=${origin}`);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// ─── Global Rate Limiting ─────────────────────────────────────
// Per-endpoint limiters are in middlewares/rateLimiter.ts
// This is a global safety net: 200 req/15min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 200 : 1000, // Stricter in production
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    data: null,
  },
});
app.use('/api', globalLimiter);

// ─── Request Parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Prevent NoSQL injection { "$gt": "" }
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── HTTP Request Logger ──────────────────────────────────────
// Production: 'combined' format (Apache-style, good for log aggregation)
// Development: 'dev' format (coloured, concise)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(isProduction ? 'combined' : 'dev'));
}

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '✅ Aptitude Test Platform API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scheduled-tests', scheduledTestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '🚫 Route not found. Please check the API endpoint.',
  });
});

// ─── Global Error Handler ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(errorHandler);

export default app;
