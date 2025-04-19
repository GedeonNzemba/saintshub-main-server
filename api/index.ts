import { app } from '../src/app.js';
import { NowRequest, NowResponse } from '@vercel/node';
import mongoose from 'mongoose';
import '../src/loadEnv.js'; // Load environment variables
import config from '../src/config/index.js';

export default async function handler(req: NowRequest, res: NowResponse) {
  console.log(`[${new Date().toISOString()}] Serverless function invoked: ${req.method} ${req.url}`);
  
  // Check if MongoDB is connected (0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting)
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
    console.log(`[${new Date().toISOString()}] MongoDB not connected. Current state: ${mongoose.connection.readyState}`);
    console.log(`[${new Date().toISOString()}] Attempting to connect to MongoDB...`);
    
    try {
      await mongoose.connect(config.database.mongodbUri);
      console.log(`[${new Date().toISOString()}] MongoDB connection successful in serverless function!`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] MongoDB connection error in serverless function:`, err);
    }
  } else {
    console.log(`[${new Date().toISOString()}] MongoDB already connected`);
  }
  
  console.log(`[${new Date().toISOString()}] Calling Express app...`);
  app(req, res); // Call Express app, don't return its result
  console.log(`[${new Date().toISOString()}] Express app called (this may not show if app handles the response)`);
}
