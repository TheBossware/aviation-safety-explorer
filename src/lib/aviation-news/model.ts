import mongoose, { Schema, type Model, type Types } from "mongoose";
import { SEVERITY_VALUES } from "@/lib/shared/types";
import type { AviationNews } from "./types";

/** A news item as MongoDB stores it (`_id` is an ObjectId). The repository returns `AviationNews`. */
export type AviationNewsDocument = Omit<AviationNews, "_id"> & { _id: Types.ObjectId };

/** Owned by n8n; also joined into by the ISIT review queue. */
export const AVIATION_NEWS_COLLECTION = "aviation_news";

/**
 * This collection is ingested by an external pipeline (n8n) — this app only
 * reads from it, so the schema is intentionally permissive (no `required`)
 * rather than gatekeeping documents this app never writes.
 */
const AviationNewsSchema = new Schema<AviationNewsDocument>(
  {
    source_id: String,
    source_name: String,
    source_type: String,
    source_category: String,
    title: String,
    title_normalized: String,
    url: String,
    content: String,
    summary: String,
    published_at: Date,
    fetched_at: Date,
    content_hash: String,
    source_tags: { type: [String], default: [] },
    post_url: String,
    category: String,
    severity: { type: String, enum: SEVERITY_VALUES },
    tags: { type: [String], default: [] },
    classified_by: String,
    classification_reasoning: String,
    rule_category: String,
    rule_severity: String,
    content_note: String,
    // No default: a missing field means "not checked yet", unlike an empty list.
    airlines: { type: [String], default: undefined },
    airline_roles: {
      type: [new Schema({ name: String, role: { type: String, enum: ["operator", "on_behalf_of", "subject"] } }, { _id: false })],
      default: undefined,
    },
    airlines_extracted_by: String,
    airlines_extracted_at: Date,
  },
  { collection: AVIATION_NEWS_COLLECTION }
);

export const AviationNewsModel: Model<AviationNewsDocument> =
  (mongoose.models.AviationNews as Model<AviationNewsDocument>) ??
  mongoose.model<AviationNewsDocument>("AviationNews", AviationNewsSchema);
