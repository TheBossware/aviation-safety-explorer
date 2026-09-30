import mongoose, { Schema, type Model, type Types } from "mongoose";
import { SOURCE_TYPE_VALUES, type Source } from "./types";

/** A source as MongoDB stores it (`_id` is an ObjectId). The repository returns `Source`. */
export type SourceDocument = Omit<Source, "_id"> & { _id: Types.ObjectId };

const SourceSchema = new Schema<SourceDocument>(
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

export const SourceModel: Model<SourceDocument> =
  (mongoose.models.Source as Model<SourceDocument>) ?? mongoose.model<SourceDocument>("Source", SourceSchema);
