// src/services/authService.ts
import jwt, { SignOptions } from 'jsonwebtoken'; // Import SignOptions
import config from '../config/index.js'; // Import consolidated config
import { IUser } from '../models/User.model.js'; // Import User interface

/**
 * Generates a JWT token for a user.
 * @param user - The user object (or relevant parts like id, email). Requires `id` property.
 * @returns The generated JWT token as a string.
 */
export const generateToken = (user: Pick<IUser, 'id'>): string => {
  // The payload typically includes user identifiers, NOT sensitive data.
  const payload = { id: user.id }; 

  console.log(`>>> Generating token for user ID: ${user.id}`);

  // Ensure the secret is loaded correctly
  if (!config.jwt.secret) {
    throw new Error('JWT secret is not configured.');
  }

  // Sign the token with the secret and expiration time
  try {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as SignOptions);
  } catch (error) {
    // Handle potential errors during token signing (though less common)
    console.error('Error signing JWT:', error);
    throw new Error('Could not sign JWT token.');
  }
};

// Add other auth-related functions if needed, e.g., verifyToken, etc.
// export const verifyToken = (token: string): any => { ... };
