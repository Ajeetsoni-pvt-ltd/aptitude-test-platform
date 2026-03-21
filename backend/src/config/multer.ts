// backend/src/config/multer.ts
// ─────────────────────────────────────────────────────────────
// Multer Configuration — File Upload Middleware
// Kyun: Express by default files handle nahi karta
// multer multipart/form-data handle karta hai (file uploads)
// ─────────────────────────────────────────────────────────────

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// ─── Step 1: Upload Directory ensure karo ─────────────────────
// Agar 'uploads/' folder exist nahi karta toh automatically banao
// Kyun: Fresh clone ke baad folder nahi hoga (.gitignore se)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Step 2: Storage Engine define karo ───────────────────────
// diskStorage → file disk pe save hogi (memory nahi)
// Kyun diskStorage: Large files memory overflow kar sakti hain
const storage = multer.diskStorage({
  // destination: File kahan save ho
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },

  // filename: File ka naam kya ho
  // Original naam rakhte hain + timestamp (duplicate avoid ke liye)
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

// ─── Step 3: File Filter — Sirf .docx allow karo ──────────────
// Kyun: Koi image/pdf/exe upload karne ki koshish kare toh reject karo
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // .docx ka MIME type yeh hota hai
  const allowedMimeType =
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (file.mimetype === allowedMimeType) {
    cb(null, true); // ✅ Accept karo
  } else {
    // ❌ Reject karo — Error message ke saath
    cb(new Error('Sirf .docx files allowed hain! PDF ya .doc nahi chalega.'));
  }
};

// ─── Step 4: Multer instance export karo ──────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Max 5MB file size
  },
});

export default upload;
