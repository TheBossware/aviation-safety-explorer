import mongoose, { Schema, type Model } from "mongoose";
import type { IsitTaxonomy } from "./types";

const IsitTaxonomySchema = new Schema<IsitTaxonomy>(
  {
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    description: { type: String, required: true },
  },
  { timestamps: true, collection: "isit_taxonomy" }
);

export const IsitTaxonomyModel: Model<IsitTaxonomy> =
  (mongoose.models.IsitTaxonomy as Model<IsitTaxonomy>) ??
  mongoose.model<IsitTaxonomy>("IsitTaxonomy", IsitTaxonomySchema);
