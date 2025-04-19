// src/loadEnv.ts
import dotenv from 'dotenv';
import path from 'path';

console.log('Attempting to load .env file...');
const envPath = path.resolve(process.cwd(), '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully. Parsed variables:', result.parsed ? Object.keys(result.parsed) : 'None');
}

// Log a specific variable to check if it's loaded
console.log("MONGODB_URI immediately after load:", process.env['MONGODB_URI'] ?? 'Not found');
