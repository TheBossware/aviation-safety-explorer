import mongoose, { Schema, type Model } from "mongoose";
import { SOURCE_TYPE_VALUES, type Source } from "./types";

const SourceSchema = new Schema<Source>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: SOURCE_TYPE_VALUES, required: true },
    url: { type: String, required: true },
    active: { type: Boolean, required: true, default: true },
    category: { type: String, required: true },
  },
  { timestamps: true, collection: "sources" }
);

export const SourceModel: Model<Source> =
  (mongoose.models.Source as Model<Source>) ?? mongoose.model<Source>("Source", SourceSchema);
