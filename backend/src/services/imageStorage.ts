import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import type { Request } from 'express';

interface ProcessedImage {
  buffer: Buffer;
  extension: string;
  mimeType: string;
}

const MAX_DIMENSION = 1800;
const MAX_IMAGE_BYTES = 1024 * 1024;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'questions');

const getPublicBaseUrl = (req: Request) => {
  const configuredBaseUrl = process.env.PUBLIC_SERVER_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const ensureLocalUploadDir = async () => {
  await fs.promises.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
};

const processImageBuffer = async (buffer: Buffer): Promise<ProcessedImage> => {
  let quality = 82;
  let bestBuffer: Buffer | null = null;

  while (quality >= 48) {
    const transformed = await sharp(buffer)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toBuffer();

    bestBuffer = transformed;

    if (transformed.length <= MAX_IMAGE_BYTES) {
      break;
    }

    quality -= 8;
  }

  if (!bestBuffer) {
    throw new Error('Image could not be processed.');
  }

  return {
    buffer: bestBuffer,
    extension: 'webp',
    mimeType: 'image/webp',
  };
};

const uploadToCloudinary = async (
  processedImage: ProcessedImage,
  originalName: string,
  folder = 'aptitude-questions'
): Promise<string> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary is not configured.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${path.parse(originalName).name}-${crypto.randomUUID()}`;
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

  const formData = new FormData();
  formData.append(
    'file',
    new Blob([new Uint8Array(processedImage.buffer)], { type: processedImage.mimeType }),
    `${publicId}.${processedImage.extension}`
  );
  formData.append('folder', folder);
  formData.append('public_id', publicId);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', apiKey);
  formData.append('signature', signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const result = (await response.json()) as { secure_url?: string; error?: { message?: string } };

  if (!response.ok || !result.secure_url) {
    throw new Error(result.error?.message || 'Cloudinary upload failed.');
  }

  return result.secure_url;
};

const storeLocally = async (
  processedImage: ProcessedImage,
  originalName: string,
  req: Request
) => {
  await ensureLocalUploadDir();

  const safeBaseName = path
    .parse(originalName)
    .name.replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();

  const fileName = `${safeBaseName || 'question'}-${crypto.randomUUID()}.${processedImage.extension}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);

  await fs.promises.writeFile(filePath, processedImage.buffer);

  return `${getPublicBaseUrl(req)}/uploads/questions/${fileName}`;
};

export const buildPreviewImageUrl = async (buffer: Buffer) => {
  const processedImage = await processImageBuffer(buffer);
  return `data:${processedImage.mimeType};base64,${processedImage.buffer.toString('base64')}`;
};

export const storeUploadedImage = async (
  file: Express.Multer.File,
  req: Request,
  folder?: string
) => {
  const processedImage = await processImageBuffer(file.buffer);
  const cloudinaryEnabled =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (cloudinaryEnabled) {
    return uploadToCloudinary(processedImage, file.originalname, folder);
  }

  return storeLocally(processedImage, file.originalname, req);
};
