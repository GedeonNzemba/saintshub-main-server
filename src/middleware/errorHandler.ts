// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ZodError, ZodIssue } from 'zod';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

// Define a structure for the processed error object passed to sender functions
interface ProcessedError {
  statusCode: number;
  status: string;
  message: string;
  isOperational?: boolean;
  stack?: string | undefined; // Allow stack to be undefined
  errors?: ZodIssue[] | { [key: string]: unknown } | undefined; // For validation or other detailed errors
  name?: string;
  // Add other potential properties like 'code' if needed for specific DB errors
  code?: number | string;
}

// ============ Error Handling Helper Functions ============ 

// Handle CastError (Invalid MongoDB ID format)
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, { details: { errors: [{ message }] } }); // Bad Request
};

// Handle Duplicate Fields Error (MongoDB Unique Constraint)
const handleDuplicateFieldsDB = (err: unknown): AppError => {
    // Type guard for error with message
    if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message: unknown }).message === 'string'
    ) {
        const valueMatch = (err as { message: string }).message.match(/(['"])(?:(?=(\\?))\2.)*?\1/);
        const value = valueMatch ? valueMatch[0] : 'Value'; // Fallback if regex fails
        const message = `Duplicate field value: ${value}. Please use another value!`;
        return new AppError(message, 400, { details: { errors: [{ message }] } });
    }
    // fallback for unexpected error shape
    return new AppError('Duplicate field value.', 400);
};

// Handle ValidationError (Mongoose Schema Validation)
const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, { details: { errors } }); // Bad Request
};

// Handle ZodError (Request Validation)
const handleZodError = (err: ZodError): AppError => {
  const errors = err.errors.map(el => `${el.path.join('.')} - ${el.message}`);
  const message = `Invalid input data: ${errors.join('; ')}`;
   // You might want to include the detailed errors in the response for development
  return new AppError(message, 400, { details: { errors: err.issues } }); // Bad Request
};

// Handle JWT Errors
const handleJWTError = (): AppError => new AppError('Invalid token. Please log in again!', 401, { details: { errors: [{ message: 'Invalid token' }] } }); // Unauthorized
const handleJWTExpiredError = (): AppError => new AppError('Your token has expired! Please log in again.', 401, { details: { errors: [{ message: 'Token expired' }] } }); // Unauthorized

// --- Development Error Response --- 
const sendErrorDev = (processedErr: ProcessedError, res: Response) => {
  res.status(processedErr.statusCode).json({
    status: processedErr.status,
    error: processedErr, // Send detailed error object
    message: processedErr.message,
    stack: processedErr.stack,
    errors: processedErr.errors, // Include detailed validation errors if present
  });
};

// --- Production Error Response --- 
const sendErrorProd = (processedErr: ProcessedError, res: Response) => {
  // A) Operational, trusted error: send message to client
  if (processedErr.isOperational) {
    res.status(processedErr.statusCode).json({
      status: processedErr.status,
      message: processedErr.message,
      // Optionally include structured errors if needed by the frontend
      ...(processedErr.errors && { errors: processedErr.errors })
    });
  // B) Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error (using a proper logger is recommended)
    console.error('ERROR ', processedErr);
    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

// ============ Global Error Handler Middleware ============ 
const globalErrorHandler = (
  err: Error | AppError | ZodError | mongoose.Error, // Expanded type
   
  _req: Request, // Mark as unused
  res: Response,
   
  _next: NextFunction // Mark as unused
) => {

  // Start with default values
  let processedError: ProcessedError = {
      statusCode: 500,
      status: 'error',
      message: err.message || 'An unknown error occurred',
      stack: err.stack,
      name: err.name,
      isOperational: false, // Default to non-operational unless specifically set
  };

  // --- Handle Specific Error Types --- 

  if (err instanceof AppError) {
      processedError = {
          ...processedError, // Keep stack, name from original AppError
          statusCode: err.statusCode,
          status: err.status,
          message: err.message,
          isOperational: err.isOperational,
          errors: err.details && typeof err.details === 'object' && 'errors' in err.details
            ? Array.isArray((err.details as { errors?: unknown }).errors)
              ? (err.details as { errors: ZodIssue[] }).errors
              : typeof (err.details as { errors?: unknown }).errors === 'object' && (err.details as { errors?: unknown }).errors !== null
                ? (err.details as { errors: { [key: string]: unknown } }).errors
                : undefined
            : undefined,
      };
  } else if (err instanceof ZodError) {
      const appError = handleZodError(err);
      processedError = {
          ...processedError, // Keep Zod stack/name if needed
          statusCode: appError.statusCode,
          status: appError.status,
          message: appError.message,
          isOperational: true, // Validation errors are operational
          errors: appError.details && typeof appError.details === 'object' && 'errors' in appError.details
            ? Array.isArray((appError.details as { errors?: unknown }).errors)
              ? (appError.details as { errors: ZodIssue[] }).errors
              : typeof (appError.details as { errors?: unknown }).errors === 'object' && (appError.details as { errors?: unknown }).errors !== null
                ? (appError.details as { errors: { [key: string]: unknown } }).errors
                : undefined
            : undefined,
      };
  } else if (err instanceof mongoose.Error.CastError) {
       const appError = handleCastErrorDB(err);
       processedError = { ...processedError, ...appError, isOperational: true };
  } else if (err instanceof mongoose.Error.ValidationError) {
      const appError = handleValidationErrorDB(err);
      processedError = { ...processedError, ...appError, isOperational: true };
  } else if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 11000
  ) { // Check for MongoDB duplicate key error code
       const appError = handleDuplicateFieldsDB(err);
       const code = (typeof err === 'object' && err !== null && 'code' in err &&
         (typeof (err as { code: unknown }).code === 'string' || typeof (err as { code: unknown }).code === 'number'))
         ? (err as { code: string | number }).code
         : undefined;
       processedError = {
         ...processedError,
         ...appError,
         isOperational: true,
         ...(code !== undefined ? { code } : {})
       };


  } else if (err.name === 'JsonWebTokenError') {
      const appError = handleJWTError();
      processedError = { ...processedError, ...appError, isOperational: true };
  } else if (err.name === 'TokenExpiredError') {
      const appError = handleJWTExpiredError();
      processedError = { ...processedError, ...appError, isOperational: true };
  } else {
      // Keep default 500 error for generic Error objects or unhandled types
      // Ensure the message is set
      processedError.message = err.message || 'An unexpected server error occurred.';
      processedError.name = err.name;
      processedError.stack = err.stack;
  }

  // --- Send Response Based on Environment --- 
  if (config.isProduction) {
    sendErrorProd(processedError, res);
  } else {
    sendErrorDev(processedError, res);
  }
};

export default globalErrorHandler;
