// src/config/cloudinaryConfig.ts
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate that Cloudinary environment variables are set
if (!process.env['CLOUDINARY_CLOUD_NAME'] || !process.env['CLOUDINARY_API_KEY'] || !process.env['CLOUDINARY_API_SECRET']) {
  console.error('Error: Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) must be set.');
  process.exit(1); // Exit if essential config is missing
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
  secure: true, // Optional: Ensures HTTPS URLs are generated
});

export default cloudinary;
