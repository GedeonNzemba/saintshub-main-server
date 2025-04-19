// src/models/User.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface representing a document in MongoDB.
export interface IUser extends Document {
  id: string; // Add the virtual 'id' property provided by Mongoose
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Password might not always be selected
  avatar?: {
    public_id?: string;
    url: string;
  };
  language: 'en' | 'fr'; // Required language field
  role: 'user' | 'pastor' | 'IT'; // User role
  churchSelection?: string; // Optional church selection
  admin: boolean; // Admin status
  createdAt: Date;
  updatedAt: Date;
  // Method to compare password (available on instances)
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Schema corresponding to the IUser interface.
const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Do not return password by default
    },
    avatar: { 
      type: {
        public_id: { type: String, required: false },
        url: { type: String, required: true }
      },
      required: false, 
    },
    language: {
      type: String,
      enum: ['en', 'fr'],
      required: [true, 'Language is required (en or fr)'],
    },
    role: {
      type: String,
      enum: ['user', 'pastor', 'IT'],
      required: [true, 'User role is required (user, pastor, or IT)'],
      default: 'user', 
    },
    churchSelection: {
      type: String,
      required: false, 
      trim: true,
    },
    admin: {
      type: Boolean,
      default: false, // Default to non-admin
    },
  },
  {
    timestamps: true, 
  }
);

// Pre-save middleware to hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt); 
    next();
  } catch (error: unknown) {
    next(error as Error);
  }
});

// Method to compare entered password with hashed password in DB
UserSchema.methods['comparePassword'] = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!(this as IUser).password) { 
      return false; 
  }
  return bcrypt.compare(candidatePassword, (this as IUser).password as string);
};

// Create and export the User model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
