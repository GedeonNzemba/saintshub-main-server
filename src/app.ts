// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path'; // Import path module
import { fileURLToPath } from 'url'; // To handle ES module __dirname equivalent

import config from './config/index.js'; // Add .js extension
import AppError from './utils/AppError.js'; // Add .js extension
import globalErrorHandler from './middleware/errorHandler.js'; // Add .js extension
import authRoutes from './routes/authRoutes.js'; // Import the auth router and add .js extension
import dashboardRoutes from './routes/dashboardRoutes.js'; // Import the dashboard router and add .js extension
import adminRoutes from './routes/adminRoutes.js'; // Import admin routes

// ======================================== 
// App Initialization
// ======================================== 
const app: Express = express();

// ======================================== 
// Global Middleware
// ======================================== 

// Security Headers (Helmet) - Should be early
app.use(helmet());

// CORS (Cross-Origin Resource Sharing) - Configure appropriately for your frontend
const corsOptions = {
  origin: config.isProduction ? config.cors.origin : '*', // Allow all in dev
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies if needed
};
app.use(cors(corsOptions));

// Body Parser (JSON)
app.use(express.json({ limit: '10kb' })); // Limit request body size

// URL-encoded data parser (optional, if using forms)
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Parse URL-encoded bodies

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize()); // Temporarily disabled if causing issues

// --- Serve Static Files ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '..', 'public'))); // Go up one level from src to root

// ======================================== 
// Application Routes
// ======================================== 

// Root/Health Check Route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Saintshub Dashboard API is running!' });
});

// Mount Authentication Routes
app.use('/api/v1/auth', authRoutes);

// Mount Dashboard Routes
app.use('/api/v1/dashboard', dashboardRoutes);

// Mount Admin Routes
app.use('/api/v1/admin', adminRoutes);

// ======================================== 
// Undefined Route Handler
// ======================================== 

// Handle all routes not caught by previous handlers
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${_req.originalUrl} on this server!`, 404));
});

// ======================================== 
// Global Error Handling Middleware
// ======================================== 
// Must be the LAST middleware added
app.use(globalErrorHandler);

// Export the configured app
export { app };
