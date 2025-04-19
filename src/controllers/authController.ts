// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User.model.js'; 
import AppError from '../utils/AppError.js';
import { generateToken } from '../services/authService.js'; 
import { sendWelcomeEmail, sendAdminNotificationEmail } from '../services/emailService.js';
import { LoginInput, SignupInput } from '../utils/validationSchemas.js'; 
import { UpdateMeInput, UpdatePasswordInput } from '../schemas/authSchemas.js'; 
import cloudinary from '../config/cloudinaryConfig.js'; 
import type { UploadApiResponse, UploadStream } from 'cloudinary'; 
import { createReadStream } from 'streamifier'; 
import catchAsync from '../utils/catchAsync.js';

/**
 * Handles user signup.
 */
const signup = catchAsync(async (req: Request<object, object, SignupInput>, res: Response, next: NextFunction) => {
  // 1) Extract data from validated request body (text fields from form-data via multer)
  const { firstName, lastName, email, password, language, role, churchSelection } = req.body;

  // 1b) Handle avatar upload (if file exists in memory buffer)
  let avatarData: { public_id?: string; url: string } | undefined;
  if (req.file && req.file.buffer) {
    try {
      // Use a Promise to wait for the Cloudinary upload stream to finish
      const uploadResult: UploadApiResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'user_avatars' }, // Optional: specify a folder in Cloudinary
          (error, result) => {
            if (error) {
              return reject(error as Error);
            }
            if (!result) {
              return reject(new Error('Cloudinary upload failed: No result returned.'));
            }
            resolve(result);
          }
        );
        // Pipe the buffer from memory to the Cloudinary upload stream
        createReadStream(req.file!.buffer).pipe(uploadStream);
      });

      // Store both public_id and secure_url
      avatarData = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      };

    } catch (error) { // Catch Cloudinary upload errors
        console.error('Cloudinary upload error during signup:', error);
        // Decide if you want to proceed without avatar or return an error
        // For now, we'll proceed, and the DB default will be used if avatarUrl remains undefined
        // return next(new AppError('Image upload failed.', 500));
    }
  }

  // 2) Check if user already exists (redundant if email has unique index, but good practice)
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email address already in use.', 400)); // Bad Request
  }

  // 3) No need to check if church exists in DB—just require churchSelection if role is pastor/IT (handled by validation schema)

  // 4) Create new user (password hashing is handled by pre-save middleware in User model)
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    avatar: avatarData, // Add avatar object { public_id, url }
    language,
    role,
    churchSelection,
  });

  // 4) Generate JWT token
  const token: string = generateToken({ id: newUser.id as string });

  // 5) Send welcome email
  // We use try...catch to prevent email failure from stopping the signup process
  try {
    // Pass required fields including lastName and role
    await sendWelcomeEmail({ firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, role: newUser.role });
    console.log(`Welcome email sent successfully to ${newUser.email}`);
  } catch (emailError) {
    console.error(`Error sending welcome email to ${newUser.email}:`, emailError);
    // Optional: Log this error to a more persistent logging system
  }

  // 6) Send admin notification email conditionally
  if (role === 'pastor' || role === 'IT') {
    try {
      // Pass required fields
      await sendAdminNotificationEmail({ firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, role: newUser.role });
      console.log(`Admin notification email sent successfully for ${newUser.email} (Role: ${role})`);
    } catch (adminEmailError) {
      console.error(`Error sending admin notification email for ${newUser.email}:`, adminEmailError);
      // Log this error
    }
  }

  // 7) Prepare response (exclude password)
  // newUser.password = undefined; // Not strictly needed due to `select: false` in schema, but reinforces intent

   // Create a user object for the response, explicitly excluding the password
   const userResponse = {
       _id: newUser._id,
       firstName: newUser.firstName,
       lastName: newUser.lastName,
       email: newUser.email,
       avatar: newUser.avatar, // Include avatar in response
       createdAt: newUser.createdAt,
       updatedAt: newUser.updatedAt,
   };


  // 8) Send response with token and user data
  res.status(201).json({ // 201 Created
    status: 'success',
    token,
    data: {
      user: userResponse,
    },
  });
});

/**
 * Handles user login.
 */
const login = catchAsync(async (req: Request<object, object, LoginInput>, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist (already handled by validation, but good safeguard)
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Check if user exists && password is correct
  // Need to explicitly select the password field as it's excluded by default
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401)); // Unauthorized
  }

  // 3) If everything ok, send token to client
  const token: string = generateToken({ id: user.id as string });

  // Create a user object for the response, explicitly excluding the password
  const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar, // Include avatar if it exists
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
  };


  res.status(200).json({
    status: 'success',
    token,
    data: {
        user: userResponse
    }
  });
});

// Get current user details (requires authentication)
const getMe = (req: Request, res: Response, next: NextFunction): void => {
    // req.user is attached by the authenticateUser middleware
    if (!req.user) {
        return next(new AppError('User not found on request. Authentication might have failed.', 401));
    }

    // Explicitly type user variable - needed to ensure TS recognizes the full type after check
    // @ts-expect-error - TS incorrectly reports 'Pick missing properties' error here despite type narrowing
    const user: IUser = req.user;

    // Construct the response object with only the desired fields
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar, // Include avatar if it exists
        },
      },
    });
};

// Logout user
const logout = (_req: Request, res: Response, _next: NextFunction): void => {
  // Clear the JWT cookie
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000), // Set expiry slightly in the future to ensure clearance
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production', // Use secure cookies in production
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
};

// Update current user details (firstName, lastName, email)
const updateMe = catchAsync(async (req: Request<object, object, UpdateMeInput>, res: Response, next: NextFunction) => { 
  // 1. Get user from collection 
  if (!req.user) {
    return next(new AppError('User not found on request.', 401));
  }
  const userId: string = req.user.id; // Use req.user.id directly

  // 2. Filter out unwanted fields names that are not allowed to be updated & build update object
  const { firstName, lastName, email } = req.body; 
  const allowedUpdates: Partial<IUser> = {}; // Use Partial<IUser> for flexibility
  if (firstName !== undefined) allowedUpdates.firstName = firstName;
  if (lastName !== undefined) allowedUpdates.lastName = lastName;
  if (email !== undefined) allowedUpdates.email = email; // Only update if provided

  if (Object.keys(allowedUpdates).length === 0) {
     return next(new AppError('No valid fields provided for update.', 400));
  }

  // Handle potential avatar update
  if (req.file?.buffer) {
    try {
      const uploadedAvatarData = await uploadToCloudinary(req.file.buffer);
      allowedUpdates.avatar = uploadedAvatarData; // Update avatar object { public_id, url }
    } catch (uploadError) {
      console.error('Error uploading avatar during updateMe:', uploadError);
      return next(new AppError('Avatar upload failed.', 500));
    }
  }

  // 3. Update user document
  const updatedUser: IUser | null = await User.findByIdAndUpdate(userId, allowedUpdates, {
    new: true, // Return the updated document
    runValidators: true, // Run schema validators on update
  });

  if (!updatedUser) {
    return next(new AppError('Error updating user details.', 500));
  }

  // Construct the response object with only the desired fields
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar, // Include avatar if it exists
      },
    },
  });
});

// Update Current User Password
const updatePassword = catchAsync(async (req: Request<object, object, UpdatePasswordInput>, res: Response, next: NextFunction) => { 
  // 1. Get user from collection
  if (!req.user) {
    return next(new AppError('User not found on request.', 401));
  }
  const userId: string = req.user.id; // Use req.user.id directly

  // 2. Get user from collection by ID
  // We need to select the password field explicitly as it's excluded by default
  const user = await User.findById(userId).select('+password');

  if (!user) {
    return next(new AppError('User not found.', 404));
  }

  // 2. Check if POSTed current password is correct
  const { currentPassword, newPassword, confirmPassword } = req.body; 

  // Add password confirmation check (moved from schema.refine)
  if (newPassword !== confirmPassword) {
    return next(new AppError("New passwords don't match", 400));
  }

  if (!(await user.comparePassword(currentPassword))) { 
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. If so, update password
  user.password = newPassword; 

  // 4. Save user (pre-save middleware will hash the password)
  await user.save();

  // 5. Log user in, send JWT token (optional - or just send success)
  // For simplicity, just send success. User might need to re-login.
  res.status(200).json({
    status: 'success',
    message: 'Password updated successfully.',
    // Optionally re-issue token here if needed
  });
});

// Update User Avatar
const updateAvatar = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1. Check if file exists
  if (!req.file) {
    return next(new AppError('No file uploaded.', 400));
  }

  // 2. Get user from request (added by protect middleware)
  if (!req.user) {
    return next(new AppError('User not found on request.', 401));
  }
  const userId: string = req.user.id; // Assertion removed, relying on type narrowing

  // 3. Upload image buffer to Cloudinary
  try {
    const result = await uploadToCloudinary(req.file.buffer);
    // 4. Update user document with Cloudinary URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: result }, // Store the { public_id, url } object
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return next(new AppError('User not found for update.', 404));
    }

    // 5. Send response
    const userObject = updatedUser.toObject();
    delete userObject.password;

    res.status(200).json({
      status: 'success',
      data: {
        user: userObject,
      },
    });

  } catch (error) {
    // Handle Cloudinary upload errors passed from the promise rejection
    return next(error); 
  }
});

// Utility function to upload buffer to Cloudinary and return { public_id, url }
const uploadToCloudinary = (buffer: Buffer): Promise<{ public_id: string; url: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream: UploadStream = cloudinary.uploader.upload_stream(
      { folder: 'user-avatars' }, // Optional: specify a folder in Cloudinary
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          return reject(error as Error); // Reject with error
        }
        if (!result) {
          return reject(new Error('Cloudinary did not return a result.'));
        }
        // Resolve with the desired object format
        resolve({ public_id: result.public_id, url: result.secure_url });
      }
    );
    createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Get User Details by ID (Protected)
 */
const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params['id']; // Use bracket notation

  // Find user by ID, exclude password
  const user = await User.findById(userId).select('-password');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  // Send successful response
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

export {
  signup,
  login,
  logout,
  getMe,
  updateMe,
  updatePassword,
  updateAvatar,
  getUserById,
};
