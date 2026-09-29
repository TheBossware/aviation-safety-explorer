import mongoose, { Schema, type Model } from "mongoose";

import { ISIT_DIMENSIONS } from "@/lib/isit-taxonomy/types";
import {
  ISIT_OUTCOME_VALUES,
  ISIT_RELATION_TYPE_VALUES,
  ISIT_REVIEW_ACTION_VALUES,
  ISIT_WORKFLOW_STATUS_VALUES,
  type IsitClassification,
  type IsitReviewEvent,
  type IsitSuggestion,
} from "./types";

/**
 * ISIT results live in their own collections: `aviation_news` belongs to the n8n pipeline and
 * its `category`/`severity` fields keep their existing meaning. Field names are snake_case to
 * match `aviation_news`.
 */

const timestamps = { createdAt: "created_at", updatedAt: "updated_at" } as const;

/**
 * The database is shared with n8n: collections and indexes are created only by an explicit
 * `ensureIndexes()` call, never as a side effect of the app or a dry run touching a model.
 */
const explicitIndexing = { autoIndex: false, autoCreate: false } as const;

const CodeAssignmentSchema = new Schema(
  {
    code: { type: String, required: true },
    dimension: { type: String, enum: ISIT_DIMENSIONS, required: true },
    label: { type: String, required: true },
    evidence_quote: { type: String, default: null },
    rationale: { type: String, default: null },
  },
  { _id: false }
);

const IsitClassificationSchema = new Schema<IsitClassification>(
  {
    news_id: { type: Schema.Types.ObjectId, required: true },
    source_id: { type: String, required: true },
    article_id: { type: String, default: null },
    input: {
      url: { type: String, required: true },
      post_url: { type: String, default: null },
      published_at: { type: Date, default: null },
      fetched_at: { type: Date, default: null },
      content_hash: { type: String, default: null },
      fingerprint: { type: String, default: null },
    },
    dates: {
      event_date: { type: Date, default: null },
      article_created_at: { type: Date, default: null },
      article_updated_at: { type: Date, default: null },
    },
    workflow_status: { type: String, enum: ISIT_WORKFLOW_STATUS_VALUES, required: true, default: "pending" },
    flags: { type: [String], default: [] },
    relations: {
      type: [
        new Schema(
          {
            type: { type: String, enum: ISIT_RELATION_TYPE_VALUES, required: true },
            news_id: { type: Schema.Types.ObjectId, default: null },
            article_id: { type: String, default: null },
            confirmed: { type: Boolean, default: false },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    ai: {
      type: new Schema(
        {
          suggestion_id: { type: Schema.Types.ObjectId, required: true },
          outcome: { type: String, enum: ISIT_OUTCOME_VALUES, required: true },
          codes: { type: [CodeAssignmentSchema], default: [] },
          created_at: { type: Date, required: true },
        },
        { _id: false }
      ),
      default: null,
    },
    final: {
      type: new Schema(
        {
          outcome: { type: String, enum: ISIT_OUTCOME_VALUES, required: true },
          codes: { type: [CodeAssignmentSchema], default: [] },
          duplicate_of: { type: Schema.Types.ObjectId, default: null },
          taxonomy_version: { type: String, required: true },
          approved_by: { type: String, required: true },
          approved_at: { type: Date, required: true },
          note: { type: String, default: null },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps, collection: "isit_classifications", ...explicitIndexing }
);

IsitClassificationSchema.index({ news_id: 1 }, { unique: true });
IsitClassificationSchema.index({ workflow_status: 1, updated_at: -1 });
IsitClassificationSchema.index({ article_id: 1 });

const IsitSuggestionSchema = new Schema<IsitSuggestion>(
  {
    news_id: { type: Schema.Types.ObjectId, required: true },
    status: { type: String, enum: ["succeeded", "failed"], required: true },
    input_fingerprint: { type: String, required: true },
    taxonomy_version: { type: String, required: true },
    model: { type: String, required: true },
    prompt_version: { type: String, required: true },
    pipeline_version: { type: String, required: true },
    outcome: { type: String, enum: ISIT_OUTCOME_VALUES, default: null },
    codes: { type: [CodeAssignmentSchema], default: [] },
    flags: { type: [String], default: [] },
    stages: { type: Schema.Types.Mixed, default: {} },
    error: { type: String, default: null },
    usage: {
      type: new Schema({ input_tokens: Number, output_tokens: Number }, { _id: false }),
      default: null,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false }, collection: "isit_suggestions", ...explicitIndexing }
);

IsitSuggestionSchema.index({ news_id: 1, created_at: -1 });
// Idempotency lookup: has this exact input already been classified with this configuration?
IsitSuggestionSchema.index({
  news_id: 1,
  input_fingerprint: 1,
  taxonomy_version: 1,
  model: 1,
  prompt_version: 1,
  status: 1,
});

const IsitReviewEventSchema = new Schema<IsitReviewEvent>(
  {
    news_id: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, enum: ISIT_REVIEW_ACTION_VALUES, required: true },
    actor: { type: String, required: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    comment: { type: String, default: null },
    suggestion_id: { type: Schema.Types.ObjectId, default: null },
    at: { type: Date, required: true, default: () => new Date() },
  },
  { collection: "isit_review_events", ...explicitIndexing }
);

IsitReviewEventSchema.index({ news_id: 1, at: -1 });

export const IsitClassificationModel: Model<IsitClassification> =
  (mongoose.models.IsitClassification as Model<IsitClassification>) ??
  mongoose.model<IsitClassification>("IsitClassification", IsitClassificationSchema);

export const IsitSuggestionModel: Model<IsitSuggestion> =
  (mongoose.models.IsitSuggestion as Model<IsitSuggestion>) ??
  mongoose.model<IsitSuggestion>("IsitSuggestion", IsitSuggestionSchema);

export const IsitReviewEventModel: Model<IsitReviewEvent> =
  (mongoose.models.IsitReviewEvent as Model<IsitReviewEvent>) ??
  mongoose.model<IsitReviewEvent>("IsitReviewEvent", IsitReviewEventSchema);
