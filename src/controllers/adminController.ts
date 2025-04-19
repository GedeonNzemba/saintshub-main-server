// src/controllers/adminController.ts
import { Request, Response } from 'express';
import User from '../models/User.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/AppError.js';
import { sendApprovalEmail } from '../services/emailService.js';

/**
 * @desc    Get users pending admin approval (role pastor/IT, admin=false)
 * @route   GET /api/v1/admin/users/pending
 * @access  Private (Admin)
 */
export const listPendingUsers = catchAsync(async (_req: Request, res: Response) => {
  const pendingUsers = await User.find({
    role: { $in: ['pastor', 'IT'] },
    admin: false
  }).select('-password'); // Exclude password from results

  res.status(200).json({
    status: 'success',
    results: pendingUsers.length,
    data: {
      users: pendingUsers,
    },
  });
});

/**
 * @desc    Approve a user by setting their admin flag to true
 * @route   PATCH /api/v1/admin/users/:userId/approve
 * @access  Private (Admin)
 */
export const approveUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { admin: true },
    {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators on update
    }
  ).select('-password');

  if (!user) {
    throw new AppError('No user found with that ID', 404);
  }

  // Send approval email notification
  try {
    await sendApprovalEmail(user);
  } catch (error) {
    // Log the error safely, checking if it's an Error instance
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to send approval email to ${user.email}: ${errorMessage}`);
    // Decide if failure to send email should cause the request to fail
    // For now, we'll just log the error and continue with a successful response
  }

  res.status(200).json({
    status: 'success',
    message: `User ${user.firstName} ${user.lastName} approved as admin.`,
    data: {
      user,
    },
  });
});

// Placeholder for potentially listing all users
// export const listAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
//   const users = await User.find().select('-password');
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });
