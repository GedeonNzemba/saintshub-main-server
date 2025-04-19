// src/controllers/dashboardController.ts - Copied and adapted from original project
import { Request, Response, NextFunction } from "express";
// import User, { UserDocument } from "../models/User.model.js"; // Potentially needed later if user info is used
// import mongoose from "mongoose"; // Not directly used in these functions
// import { logoutMiddleware } from "../middlewares/authMiddleware"; // Unused import
// import bcrypt from "bcrypt"; // Unused import
import { ChurchModel } from "../models/Space.js"; // Adjusted import path

// Interface for request params needing church ID

// Get all public churches
const getAllChurch = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const churches = await ChurchModel.find();
  res.json(churches);
};

// Get a single church by ID
const getChurch = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  const { id } = req.params;
  // Populate 'user' field, excluding password
  const church = await ChurchModel.findById(id).populate('user', '-password');
  if (!church) {
    res.status(404).json({ error: "Church not found" });
    return;
  }
  res.json(church);
};

// Get public church list
const getPublicChurchList = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  // Select only the _id and name fields
  const churches = await ChurchModel.find({}, '_id name');
  res.json(churches);
};

export default {getAllChurch, getChurch, getPublicChurchList};
