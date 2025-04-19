// src/middleware/authenticateUser.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import User, { IUser } from '../models/User.model.js'; // Assuming User model exists

// Define the expected shape of the JWT payload
interface TokenPayload extends jwt.JwtPayload {
  id: string;
}

// Use module augmentation to add 'user' to the Request interface
declare module 'express-serve-static-core' {
  interface Request {
    user?: Pick<IUser, 'id' | 'email'>; // Or the full IUser object if needed
  }
}

/**
 * Middleware to authenticate users based on JWT token.
 * Verifies the token and attaches user information to the request object.
 */
const authenticateUser = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // 1) Get token from header
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401) // Unauthorized
      );
    }

    // 2) Verify token
    let decoded: string | jwt.JwtPayload | TokenPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      // Handle specific JWT errors (like expired or invalid)
      if (err instanceof jwt.JsonWebTokenError) {
          return next(new AppError('Invalid token. Please log in again.', 401));
      }
      if (err instanceof jwt.TokenExpiredError) {
        return next(new AppError('Your token has expired. Please log in again.', 401));
      }
      // For other verification errors
      return next(new AppError('Token verification failed.', 401));
    }

    // Ensure decoded is an object and has the id property
    if (typeof decoded !== 'object' || decoded === null || !('id' in decoded)) {
      return next(new AppError('Invalid token payload.', 401));
    }

    // 3) Check if user still exists (optional but recommended)
    // 'decoded.id' depends on the payload structure used during token generation
    const currentUser = await User.findById(decoded['id']).select('+email'); // Ensure email is selected if needed

    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token no longer exists.',
          401 // Unauthorized
        )
      );
    }

    // 4) Check if user changed password after the token was issued (optional)
    // This requires storing 'passwordChangedAt' on the User model
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(new AppError('User recently changed password! Please log in again.', 401));
    // }

    // Grant access: Attach user info to the request object, casting types for safety
    req.user = { id: currentUser.id as string, email: currentUser.email };
    next(); // Proceed to the protected route

  } catch (error) {
    // Catch any unexpected errors during the process
     next(error); // Pass to global error handler
  }
};

export default authenticateUser;

/**
 * Middleware to authorize admin users.
 * Checks if the authenticated user has the 'admin' flag set to true.
 * Must run AFTER authenticateUser.
 */
export const isAdmin = async (req: Request, _res: Response, next: NextFunction) => {
  // 1. Check if user is attached to request (should be by authenticateUser)
  if (!req.user?.id) {
    // This should ideally not happen if authenticateUser runs first
    return next(new AppError('Authentication required.', 401));
  }

  try {
    // 2. Fetch the user from the database to get the admin field
    // We fetch again to ensure we have the latest user data including the admin flag
    const user = await User.findById(req.user.id).select('+admin');

    // 3. Check if user exists and is an admin
    if (!user) {
      return next(new AppError('User not found.', 401)); // Or 404 depending on context
    }

    if (!user.admin) {
      return next(
        new AppError('You do not have permission to perform this action.', 403) // Forbidden
      );
    }

    // 4. User is an admin, proceed
    next();
  } catch (error) {
    next(error); // Pass any database errors to the global handler
  }
};
