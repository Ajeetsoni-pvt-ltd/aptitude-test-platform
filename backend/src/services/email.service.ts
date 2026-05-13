// backend/src/services/email.service.ts
// ─────────────────────────────────────────────────────────────
// Reusable Email Service — Nodemailer with Gmail SMTP
// Production-ready: async error handling, env-based config
// ─────────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
} from '../templates/emailTemplates';

// ─── Transporter Configuration ──────────────────────────────
// Creates a new transporter each call for resilience
// (connection pooling not needed at this scale)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Production timeout settings
    connectionTimeout: 10000, // 10s to establish connection
    greetingTimeout: 10000,   // 10s for SMTP greeting
    socketTimeout: 15000,     // 15s for socket inactivity
  });
};

// ─── Get Primary Client URL ─────────────────────────────────
// CLIENT_URL may be comma-separated (for CORS), but for email
// links we need just the primary (first) HTTPS URL.
const getClientUrl = (): string => {
  const raw = process.env.CLIENT_URL || 'http://localhost:5173';
  // If comma-separated, pick the first https:// URL, or first URL
  const urls = raw.split(',').map((u) => u.trim());
  const httpsUrl = urls.find((u) => u.startsWith('https://'));
  return httpsUrl || urls[0];
};

// ─── Generic Email Sender ───────────────────────────────────
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || `"ApptitudeTest.live" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[email:sent]', {
      to: options.to,
      subject: options.subject,
      messageId: info.messageId,
    });
    return true;
  } catch (error) {
    console.error('[email:failed]', {
      to: options.to,
      subject: options.subject,
      error: (error as Error).message,
    });
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// Send Verification Email
// Link: https://aptitudetest.site/verify-email?token=xxx
// ═══════════════════════════════════════════════════════════════
export const sendVerificationEmail = async (
  userEmail: string,
  userName: string,
  rawToken: string
): Promise<boolean> => {
  const clientUrl = getClientUrl();
  const verificationUrl = `${clientUrl}/verify-email?token=${rawToken}`;
  const html = getVerificationEmailTemplate(userName, verificationUrl);

  return sendEmail({
    to: userEmail,
    subject: 'Verify Your Email — ApptitudeTest.live',
    html,
  });
};

// ═══════════════════════════════════════════════════════════════
// Send Password Reset Email
// Link: https://aptitudetest.site/reset-password?token=xxx
// ═══════════════════════════════════════════════════════════════
export const sendPasswordResetEmail = async (
  userEmail: string,
  userName: string,
  rawToken: string
): Promise<boolean> => {
  const clientUrl = getClientUrl();
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
  const html = getPasswordResetEmailTemplate(userName, resetUrl);

  return sendEmail({
    to: userEmail,
    subject: 'Reset Your Password — ApptitudeTest.live',
    html,
  });
};
