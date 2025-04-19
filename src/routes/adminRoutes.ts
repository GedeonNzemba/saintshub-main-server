// src/routes/adminRoutes.ts
import express from 'express';
import * as adminController from '../controllers/adminController.js';
import authenticateUser, { isAdmin } from '../middleware/authenticateUser.js';

const router = express.Router();

// All routes below this point require the user to be authenticated AND an admin
router.use(authenticateUser);
router.use(isAdmin);

// --- Admin Routes ---

// GET /api/v1/admin/users/pending - List users pending approval
router.get('/users/pending', adminController.listPendingUsers);

// PATCH /api/v1/admin/users/:userId/approve - Approve a specific user
router.patch('/users/:userId/approve', adminController.approveUser);

// GET /api/v1/admin/users - Placeholder for listing all users
// router.get('/users', adminController.listAllUsers);

export default router;
