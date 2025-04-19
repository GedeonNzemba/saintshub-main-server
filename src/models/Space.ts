// src/models/Space.ts - Copied from original project
import mongoose, { Document, Schema } from "mongoose";

// The user that has created the ChurchDoc
interface User {
  name: string;
  email: string;
  _id: string;
  image: string;
}

interface Principal {
  pastor: string;
  wife: string;
  image: string;
  description: string;
}

interface Deacon {
  names: string;
  descriptions: string;
  image: string;
}

interface Trustee {
  names: string;
  descriptions: string;
  image: string;
}

interface Securities {
  deacons: Deacon[];
  trustees: Trustee[];
}

interface LiveService {
  title: string;
  preacher: string;
  sermon: string;
}

interface Songs {
  title: string;
  songUrl: string;
}

export interface ChurchDoc extends Document {
  // liveTitle: string,
  // liveUrl: string,
  name: string;
  principal: Principal;
  location: string;
  image: string;
  banner: string[];
  securities: Securities;
  oldServices: LiveService[];
  liveServices: LiveService[]; // Note: Schema definition differs slightly
  gallery: string[];
  songs: Songs[];
  logo: string;
  user: User; // Note: Schema defines this as Object
  createdAt: Date
}

const ChurchSchema: Schema = new Schema({
  name: { type: String, required: true },
  principal: { type: Object, required: true }, // Consider defining a sub-schema for better validation
  location: { type: String, required: true },
  image: { type: String, required: true },
  banner: { type: [String], required: true },
  securities: { type: Object, required: true }, // Consider defining a sub-schema
  oldServices: { type: [Object], required: true }, // Consider defining a sub-schema
  liveServices: {
    type: [{
      // Original schema had 'type: Object' nested here which might be unintentional.
      // Keeping as array of Objects for now, but consider defining a LiveService sub-schema.
      date: { type: Date, default: Date.now },
      title: String,
      preacher: String,
      sermon: String
    }],
    required: true,
    default: []
  },
  gallery: { type: [String], required: true, default: [] },
  songs: { type: [Object], required: true, default: [] }, // Consider defining a sub-schema
  logo: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Now supports Mongoose population
  createdAt: { type: Date, default: Date.now}
});
// createdAt: { type: Date, default: Date.now, expires: '24h' }
export const ChurchModel = mongoose.model<ChurchDoc>("Church", ChurchSchema);
