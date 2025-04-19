// src/@types/express/index.d.ts
import { IUser } from '../../models/User.model'; // Adjust path if necessary

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Make it optional as it might not exist before auth
    }
  }
}
