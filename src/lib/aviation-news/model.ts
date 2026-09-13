import mongoose, { Schema, type Model } from "mongoose";
import { SEVERITY_VALUES } from "@/lib/shared/types";
import type { AviationNews } from "./types";

/**
 * This collection is ingested by an external pipeline (n8n) — this app only
 * reads from it, so the schema is intentionally permissive (no `required`)
 * rather than gatekeeping documents this app never writes.
 */
const AviationNewsSchema = new Schema<AviationNews>(
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
    fr_type: String,
    is_proposed: Boolean,
    effective_on: Date,
    content_note: String,
  },
  { collection: "aviation_news" }
);

export const AviationNewsModel: Model<AviationNews> =
  (mongoose.models.AviationNews as Model<AviationNews>) ??
  mongoose.model<AviationNews>("AviationNews", AviationNewsSchema);
