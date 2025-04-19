// src/utils/catchAsync.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to the global error handler.
 * @param fn - The async route handler function.
 * @returns A function that executes the handler and catches errors.
 */
const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next); // Pass errors to next() which goes to globalErrorHandler
  };
};

export default catchAsync;
