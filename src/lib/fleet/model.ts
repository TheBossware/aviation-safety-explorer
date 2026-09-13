import mongoose, { Schema, type Model } from "mongoose";
import type { Fleet } from "./types";

const FleetSchema = new Schema<Fleet>(
  {
    typeCode: { type: String, required: true, unique: true, trim: true },
    typeName: { type: String, required: true },
    manufacturer: { type: String, required: true },
    aircraftCount: { type: Number, required: true, min: 0, default: 0 },
    totalEngines: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, collection: "fleet" }
);

export const FleetModel: Model<Fleet> =
  (mongoose.models.Fleet as Model<Fleet>) ?? mongoose.model<Fleet>("Fleet", FleetSchema);
