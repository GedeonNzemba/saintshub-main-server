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
console.log(`[${new Date().toISOString()}] Starting Express app initialization`);
const app: Express = express();
console.log(`[${new Date().toISOString()}] Express app instance created`);

// ======================================== 
// Global Middleware
// ======================================== 

// Security Headers (Helmet) - Should be early
console.log(`[${new Date().toISOString()}] Setting up Helmet security headers`);
app.use(helmet());
console.log(`[${new Date().toISOString()}] Helmet security headers configured`);

// CORS (Cross-Origin Resource Sharing) - Configure appropriately for your frontend
const corsOptions = {
  origin: config.isProduction ? config.cors.origin : '*', // Allow all in dev
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Allow cookies if needed
};
console.log(`[${new Date().toISOString()}] Setting up CORS with options:`, corsOptions);
app.use(cors(corsOptions));
console.log(`[${new Date().toISOString()}] CORS middleware configured`);

// Body Parser (JSON)
console.log(`[${new Date().toISOString()}] Setting up JSON body parser`);
app.use(express.json({ limit: '10kb' })); // Limit request body size
console.log(`[${new Date().toISOString()}] JSON body parser configured`);

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
console.log(`[${new Date().toISOString()}] Setting up root/health check route`);
app.get('/', (_req: Request, res: Response) => {
  console.log(`[${new Date().toISOString()}] Health check route accessed`);
  res.status(200).json({ status: 'success', message: 'Saintshub Dashboard API is running!' });
});
console.log(`[${new Date().toISOString()}] Root/health check route configured`);

// Mount Authentication Routes
console.log(`[${new Date().toISOString()}] Mounting authentication routes`);
app.use('/api/v1/auth', authRoutes);
console.log(`[${new Date().toISOString()}] Authentication routes mounted`);

// Mount Dashboard Routes
console.log(`[${new Date().toISOString()}] Mounting dashboard routes`);
app.use('/api/v1/dashboard', dashboardRoutes);
console.log(`[${new Date().toISOString()}] Dashboard routes mounted`);

// Mount Admin Routes
console.log(`[${new Date().toISOString()}] Mounting admin routes`);
app.use('/api/v1/admin', adminRoutes);
console.log(`[${new Date().toISOString()}] Admin routes mounted`);

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

console.log(`[${new Date().toISOString()}] Express app initialization complete`);

// Export the configured app
export { app };
