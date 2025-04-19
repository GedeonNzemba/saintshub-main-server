import { z } from 'zod';

// Schema for user registration
export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

// Schema for user login
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // Basic check, actual length check during login logic
});

// Schema for updating current user details (firstName, lastName)
export const updateMeSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  email: z.string().email('Invalid email address').optional(), // Allow optional email update if needed
});

// Schema for updating current user password
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
});

// Define TypeScript types inferred from schemas if needed elsewhere
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
