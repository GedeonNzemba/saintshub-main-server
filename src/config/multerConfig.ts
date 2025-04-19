// src/config/multerConfig.ts
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import AppError from '../utils/AppError.js';

// Configure Multer storage (store in memory as Buffer)
const multerStorage = multer.memoryStorage();

// Configure Multer file filter (accept only images)
const multerFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // Accept file
  } else {
    // Reject file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    cb(new AppError('Not an image! Please upload only images.', 400) as any, false); 
    // Need 'as any' because AppError doesn't perfectly match the Error type Multer expects for the callback
  }
};

// Create Multer upload instance
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Middleware to handle single file upload (e.g., field named 'avatar')
export const uploadUserPhoto = upload.single('avatar');

// If you needed multiple files (e.g., 'images', max 5):
// export const uploadTourImages = upload.fields([
//   { name: 'imageCover', maxCount: 1 },
//   { name: 'images', maxCount: 3 }
// ]);
