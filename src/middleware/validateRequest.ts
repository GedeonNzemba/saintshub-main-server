// src/middleware/validateRequest.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware factory function to validate request data against a Zod schema.
 * It validates req.body, req.params, and req.query.
 *
 * @param schema - The Zod schema to validate against.
 * @returns An Express middleware function.
 */
const validateRequest = 
  (schema: AnyZodObject) => 
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Attempt to parse and validate the request parts against the schema
      // Zod automatically handles extracting the correct parts (body, params, query)
      await schema.parseAsync({
        body: req.body as unknown,
        query: req.query as unknown,
        params: req.params as unknown,
      });
      // If validation is successful, proceed to the next middleware/handler
      return next();
    } catch (error: unknown) {
      // If validation fails, pass the ZodError to the global error handler
      // The global error handler is configured to handle ZodErrors specifically
      if (error instanceof ZodError) {
        // We can pass the original ZodError for detailed handling in the global error handler
        return next(error);
      }
      // If it's not a ZodError, pass it along as a generic error
      return next(new Error('An unexpected error occurred during validation.'));
    }
  };

export default validateRequest;
