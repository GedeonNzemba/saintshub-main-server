// src/routes/dashboardRoutes.ts - Migrated from original project's authDashboard.ts
import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { ChurchDoc, ChurchModel } from "../models/Space.js"; // Adjusted path
import authenticateUser from "../middleware/authenticateUser.js"; // Using existing auth middleware
import dashboardController from "../controllers/dashboardController.js"; // Adjusted path
import z, { ZodError } from 'zod'; // Import Zod

// === Zod Schemas ===

// Schemas for nested objects (matching Space.ts interfaces)
const principalSchema = z.object({
  pastor: z.string().min(1, "Pastor name required"),
  wife: z.string().optional(),
  image: z.string().url("Invalid URL for principal image").optional(),
  description: z.string().optional(),
});

const deaconSchema = z.object({
  names: z.string().min(1, "Deacon name required"),
  descriptions: z.string().optional(),
  image: z.string().url("Invalid URL for deacon image").optional(),
});

const trusteeSchema = z.object({
  names: z.string().min(1, "Trustee name required"),
  descriptions: z.string().optional(),
  image: z.string().url("Invalid URL for trustee image").optional(),
});

const securitiesSchema = z.object({
  deacons: z.array(deaconSchema).min(1, "At least one deacon is required"), 
  trustees: z.array(trusteeSchema).min(1, "At least one trustee is required"),
});

const liveServiceSchema = z.object({
  title: z.string().min(1, "Service title required"),
  preacher: z.string().optional(),
  sermon: z.string().optional(),
  // Assuming 'date' is handled automatically by Mongoose default
});

const songsSchema = z.object({
  title: z.string().min(1, "Song title required"),
  songUrl: z.string().url("Invalid URL for song"),
});

// Main Church Schemas
const createChurchSchema = z.object({
  name: z.string().min(1, { message: "Church name is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  principal: principalSchema, // Required object
  image: z.string().url({ message: "Valid church image URL is required" }),
  logo: z.string().url({ message: "Valid logo URL is required" }),
  banner: z.array(z.string().url({ message: "Each banner item must be a valid URL" })).min(1, "At least one banner image URL is required"),
  securities: securitiesSchema, // Now required
  oldServices: z.array(liveServiceSchema).min(1, "At least one past service record is required"), 
  liveServices: z.array(liveServiceSchema).min(1, "At least one live service record is required"), 
  gallery: z.array(z.string().url({ message: "Each gallery item must be a valid URL" })).min(1, "At least one gallery image URL is required"),
  songs: z.array(songsSchema).min(1, "At least one song is required"), 
  // 'user' field is likely added server-side based on authenticated user, not sent in request body
});

// Schema for updating a church (PATCH) - fields are optional
const updateChurchSchema = createChurchSchema.partial(); // Makes all fields optional for PATCH

// Type for the validated request body
type CreateChurchInput = z.infer<typeof createChurchSchema>;
type UpdateChurchInput = z.infer<typeof updateChurchSchema>;

// === Validation Middleware ===
const validateRequest = (schema: z.ZodSchema): RequestHandler => 
  (req: Request, res: Response, next: NextFunction) => {
  try {
    schema.parse(req.body); // Pass req.body directly
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      if (error instanceof Error) {
        next(error);
      } else {
        next(new Error(String(error)));
      }
    }
  }
};

// Interfaces might need adjustment based on how User is attached in authenticateUser
// For now, assuming req.user contains the necessary ID if needed.

interface ChurchIdParams {
  id: string;
}

interface DeleteItemParams {
  churchId: string;
  imageIndex?: string; // For gallery/banner
  serviceIndex?: string; // For past services
  deaconIndex?: string;
  trusteeIndex?: string;
  songIndex?: string;
  liveIndex?: string;
}

const router = express.Router();

// Define a type for async route handlers for clarity
type AsyncRequestHandler<Req = Request, Res = Response, Nxt = NextFunction, Ret = void> =
  (req: Req, res: Res, next: Nxt) => Promise<Ret>;

// Generic utility function to catch errors in async handlers
const catchAsync = <Req = Request, Res = Response, Nxt = NextFunction, Ret = void>(
  fn: AsyncRequestHandler<Req, Res, Nxt, Ret>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Execute the function, ensuring it's treated as a Promise, and catch errors
    Promise.resolve(fn(req as Req, res as Res, next as Nxt))
           .catch((error: unknown) => {
             if (error instanceof Error) {
               next(error);
             } else {
               next(new Error(String(error)));
             }
           }); // Pass only Error objects to the Express error handler
  };
};

// === CRUD Operations for Church ===

// Create a new church - Requires Authentication & Validation
router.post(
  "/churches", 
  authenticateUser, 
  validateRequest(createChurchSchema), // Apply validation middleware
  catchAsync(async (req: Request<object, object, CreateChurchInput>, res: Response) => {
  // req.body is now validated and typed as CreateChurchInput
  // Ensure req.user is available (should be guaranteed by authenticateUser middleware)
  if (!req.user || !req.user.id) {
    // This case should ideally not happen if authenticateUser works correctly
    return res.status(401).json({ message: 'Authentication error: User not found on request' });
  }

  // Create the data object for Mongoose, including the user ID
  const dataToSave = {
    ...req.body, // Spread the validated church data
    user: req.user.id // Add the user ID from the authenticated user
  };

  const newChurch = await ChurchModel.create(dataToSave);
  res.status(201).json(newChurch);
  return; // Explicitly return void to satisfy TypeScript
}));

// Get All Churches (Protected)
router.get("/churches", authenticateUser, catchAsync(dashboardController.getAllChurch));

// Get Public Church List (ID and Name only - Unprotected)
router.get("/public/churches", dashboardController.getPublicChurchList);

// Get Single Church (Protected)
router.get("/churches/:id", authenticateUser, catchAsync(dashboardController.getChurch));

// Update a church - Requires Authentication & Validation
router.patch(
  "/churches/:id", 
  authenticateUser, 
  validateRequest(updateChurchSchema), // Apply validation middleware
  catchAsync(async (req: Request<ChurchIdParams, ChurchDoc | { message: string; }, UpdateChurchInput>, res: Response<ChurchDoc | { message: string; }>) => {
  // req.body is now validated and typed as UpdateChurchInput
  const church = await ChurchModel.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Return the updated document
    runValidators: true, // Run schema validators on update
  });
  if (!church) {
    res.status(404).json({ message: "Church not found" });
    return;
  }
  res.json(church);
}));

// Note: The original had a PATCH for specific fields: /churches/:id/:field
// This is less common and often handled by the full PATCH/PUT above.
// Omitting it for now unless specifically needed.

// Delete Church (Protected)
router.delete('/churches/:id', authenticateUser, catchAsync(async (req: Request<ChurchIdParams>, res: Response) => {
  const churchId = req.params.id;
  const deletedChurch = await ChurchModel.findByIdAndDelete(churchId);
  if (!deletedChurch) {
    res.status(404).json({ error: 'Church not found' });
    return;
  }
  res.status(204).json({ message: 'Church deleted successfully' }); // 204 No Content is typical for successful DELETE
}));

// === Delete Operations for Nested Array Items ===

// Generic function to handle deletion of items within nested arrays
const deleteNestedItem = async (req: Request<DeleteItemParams>, res: Response, arrayField: keyof ChurchDoc, indexParam: keyof DeleteItemParams) => {
    const { churchId } = req.params;
    const indexStr = req.params[indexParam];
    const index = indexStr ? parseInt(indexStr, 10) : NaN;

    if (isNaN(index)) {
        res.status(400).json({ error: `Invalid ${indexParam.replace('Index', '')} index` });
    }

    const church = await ChurchModel.findById(churchId);
    if (!church) {
        res.status(404).json({ error: 'Church not found' });
        return;
    }

    // Access the dynamic field safely, following TS suggestion for casting
    const potentialArray = (church as unknown as Record<string, unknown>)[arrayField];

    // Check if the field exists and is an array
    if (!Array.isArray(potentialArray)) {
        console.error(`Field ${arrayField} is not an array on church ${churchId}`);
        res.status(500).json({ error: 'Internal server error (invalid field type)' });
        return;
    }

    // Now TypeScript knows potentialArray is unknown[]
    const array: unknown[] = potentialArray;

    if (index < 0 || index >= array.length) {
        res.status(400).json({ error: `Invalid ${indexParam.replace('Index', '')} index` });
        return;
    }

    array.splice(index, 1);
    await church.save();
    res.status(200).json({ message: `${arrayField.slice(0, -1)} item deleted successfully` }); // Simple pluralization
};

// Delete Gallery Image
router.delete('/churches/:churchId/gallery/:imageIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    await deleteNestedItem(req, res, 'gallery', 'imageIndex');
}));

// Delete Banner Image - Make handler async to match catchAsync expectation
// eslint-disable-next-line @typescript-eslint/require-await
router.delete('/churches/:churchId/banner/:imageIndex', authenticateUser, catchAsync(async (_req: Request<DeleteItemParams>, res: Response) => {
    // Assuming banner field exists on ChurchDoc - Add it to interface/schema if missing
    // await deleteNestedItem(req, res, 'banner', 'imageIndex'); // Uncomment if 'banner' is an array field
     res.status(501).json({ message: 'Banner deletion not implemented yet' }); // Placeholder
}));

// Delete Past Service
router.delete('/churches/:churchId/past-service/:serviceIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    // Assuming 'oldServices' is the correct field name
    await deleteNestedItem(req, res, 'oldServices', 'serviceIndex');
}));

// Delete Deacon
router.delete('/churches/:churchId/deacon/:deaconIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    // Need to access nested array: church.securities.deacons
    // This requires a more specific implementation than deleteNestedItem
    const { churchId, deaconIndex: deaconIndexStr } = req.params;
    const deaconIndex = deaconIndexStr ? parseInt(deaconIndexStr, 10) : NaN;

    if (isNaN(deaconIndex)) {
        res.status(400).json({ error: 'Invalid deacon index' });
    }
    const church = await ChurchModel.findById(churchId);
    if (!church) {
        res.status(404).json({ error: 'Church not found' });
        return;
    }
    if (!church.securities || !Array.isArray(church.securities.deacons)) {
        res.status(400).json({ error: 'Deacons data not found or invalid' });
    }
    if (deaconIndex < 0 || deaconIndex >= church.securities.deacons.length) {
        res.status(400).json({ error: 'Invalid deacon index' });
    }
    church.securities.deacons.splice(deaconIndex, 1);
    await church.save();
    res.json({ message: 'Deacon deleted successfully' });
}));

// Delete Trustee
router.delete('/churches/:churchId/trustee/:trusteeIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    // Similar specific implementation needed for trustees
     const { churchId, trusteeIndex: trusteeIndexStr } = req.params;
    const trusteeIndex = trusteeIndexStr ? parseInt(trusteeIndexStr, 10) : NaN;

    if (isNaN(trusteeIndex)) {
        res.status(400).json({ error: 'Invalid trustee index' });
    }
    const church = await ChurchModel.findById(churchId);
    if (!church) {
        res.status(404).json({ error: 'Church not found' });
        return;
    }
     if (!church.securities || !Array.isArray(church.securities.trustees)) {
        res.status(400).json({ error: 'Trustees data not found or invalid' });
    }
    if (trusteeIndex < 0 || trusteeIndex >= church.securities.trustees.length) {
        res.status(400).json({ error: 'Invalid trustee index' });
    }
    church.securities.trustees.splice(trusteeIndex, 1);
    await church.save();
    res.json({ message: 'Trustee deleted successfully' });
}));

// Delete Song
router.delete('/churches/:churchId/song/:songIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    await deleteNestedItem(req, res, 'songs', 'songIndex');
}));

// Delete Live Service
router.delete('/churches/:churchId/live/:liveIndex', authenticateUser, catchAsync(async (req: Request<DeleteItemParams>, res: Response) => {
    await deleteNestedItem(req, res, 'liveServices', 'liveIndex');
}));


export default router;
