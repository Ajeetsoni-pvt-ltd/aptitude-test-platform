import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/svg+xml',
]);

const XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
]);

const CSV_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
]);

const ZIP_MIME_TYPES = new Set([
  'application/zip',
  'application/x-zip-compressed',
  'multipart/x-zip',
  'application/octet-stream',
]);

const isImageFile = (file: Express.Multer.File) =>
  IMAGE_MIME_TYPES.has(file.mimetype) || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(file.originalname);

const isWorkbookFile = (file: Express.Multer.File) =>
  XLSX_MIME_TYPES.has(file.mimetype) ||
  CSV_MIME_TYPES.has(file.mimetype) ||
  /\.(xlsx|csv)$/i.test(file.originalname);

const isZipFile = (file: Express.Multer.File) =>
  ZIP_MIME_TYPES.has(file.mimetype) || /\.zip$/i.test(file.originalname);

const manualQuestionFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (!isImageFile(file)) {
    cb(new Error('Only image files are allowed for question and option uploads.'));
    return;
  }

  cb(null, true);
};

const bulkQuestionFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if ((file.fieldname === 'file' || file.fieldname === 'excelFile') && isWorkbookFile(file)) {
    cb(null, true);
    return;
  }

  if (file.fieldname === 'imagesZip' && isZipFile(file)) {
    cb(null, true);
    return;
  }

  cb(new Error('Bulk upload accepts a .xlsx or .csv workbook and an optional .zip image bundle.'));
};

export const manualQuestionUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: manualQuestionFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },
}).fields([
  { name: 'questionImage', maxCount: 1 },
  { name: 'optionA_image', maxCount: 1 },
  { name: 'optionB_image', maxCount: 1 },
  { name: 'optionC_image', maxCount: 1 },
  { name: 'optionD_image', maxCount: 1 },
]);

export const bulkQuestionUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: bulkQuestionFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 2,
  },
}).fields([
  { name: 'file', maxCount: 1 },
  { name: 'excelFile', maxCount: 1 },
  { name: 'imagesZip', maxCount: 1 },
]);
