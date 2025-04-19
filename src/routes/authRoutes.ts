// src/routes/authRoutes.ts
import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import validateRequest from '../middleware/validateRequest.js';
import { signupSchema, loginSchema } from '../utils/validationSchemas.js';
import { updateMeSchema, updatePasswordSchema } from '../schemas/authSchemas.js';
import authenticateUser from '../middleware/authenticateUser.js'; // Import auth middleware
import { uploadUserPhoto } from '../config/multerConfig.js'; // Import multer middleware - Reverted to .js for tsx compatibility

const router = Router();

// --- Public Routes ---

// POST /api/v1/auth/signup - User Registration
// Multer handles form-data (incl. file), then validation runs on req.body
router.post('/signup', uploadUserPhoto, validateRequest(signupSchema), authController.signup);

// POST /api/v1/auth/login - User Login
router.post('/login', validateRequest(loginSchema), authController.login);


// --- Protected Routes (Require Authentication) ---

// GET /api/v1/auth/me - Get Current User Details
// The authenticateUser middleware runs first, then authController.getMe
router.get('/me', authenticateUser, authController.getMe);

// GET /api/v1/auth/users/:id - Get User by ID (Now Public)
router.get('/users/:id', authController.getUserById);

// POST /api/v1/auth/logout - User Logout
router.post('/logout', authenticateUser, authController.logout);

// PATCH /api/v1/auth/updateMe - Update User Details
router.patch('/updateMe', authenticateUser, validateRequest(updateMeSchema), authController.updateMe);

// PATCH /api/v1/auth/update-password - Update User Password
router.patch('/update-password', authenticateUser, validateRequest(updatePasswordSchema), authController.updatePassword);

// PATCH /api/v1/auth/update-avatar - Update User Avatar
router.patch('/update-avatar', authenticateUser, uploadUserPhoto, authController.updateAvatar);

// Add other auth-related routes here (e.g., forgot password, reset password)

export default router;
