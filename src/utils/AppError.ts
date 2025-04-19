// src/utils/AppError.ts

/**
 * Custom error class for application-specific errors.
 * Extends the built-in Error class to include an HTTP status code and operational flag.
 */
class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public details?: unknown; // Use unknown for better type safety than any

  /**
   * Creates an instance of AppError.
   * @param message - The error message.
   * @param statusCode - The HTTP status code (e.g., 400, 404, 500).
   * @param details - Optional additional details about the error.
   */
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message); // Call the parent constructor (Error)

    this.statusCode = statusCode;
    // Determine status based on statusCode (fail for 4xx, error for 5xx)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // Mark as operational error (expected, handled errors vs. programming bugs)
    this.isOperational = true;
    this.details = details;

    // Capture the stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);

    // Set the prototype explicitly for correct instance checking
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export default AppError;
