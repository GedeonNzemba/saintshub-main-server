// src/utils/validationSchemas.ts
import { z } from 'zod';

/**
 * Zod schema for user signup validation.
 */
export const signupSchema = z.object({
  body: z.object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .min(1, 'First name cannot be empty'),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .min(1, 'Last name cannot be empty'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long'),
    language: z.enum(['en', 'fr'], {
      required_error: 'Language is required',
      invalid_type_error: 'Language must be either \'en\' or \'fr\'',
    }),
    role: z.enum(['user', 'pastor', 'IT'], {
      required_error: 'Role is required',
      invalid_type_error: 'Role must be one of: user, pastor, IT',
    }),
    churchSelection: z.string().trim().optional(),
    // Add confirmPassword if needed and refine() for matching
    // confirmPassword: z.string().min(8),
  }).refine(
    (data) => {
      if (data.role === 'pastor' || data.role === 'IT') {
        return !!data.churchSelection && data.churchSelection.trim().length > 0;
      }
      return true;
    },
    {
      message: 'Church selection is required for pastors and IT.',
      path: ['churchSelection'],
    }
  ),
  // Example for validating params or query if needed:
  // params: z.object({ userId: z.string().uuid() }),
  // query: z.object({ page: z.coerce.number().int().positive().optional() })
});

// .refine((data) => data.body.password === data.body.confirmPassword, {
//   message: "Passwords don't match",
//   path: ["body.confirmPassword"], // path of error
// });

// Define other schemas here as needed (e.g., loginSchema)
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: 'Email is required' })
            .email('Invalid email address'),
        password: z
            .string({ required_error: 'Password is required' })
            .min(1, 'Password cannot be empty'), // Min 1, actual length check happens during auth
    })
});

// Type alias for convenience (optional)
export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
