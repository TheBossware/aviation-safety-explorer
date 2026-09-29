import { Types } from "mongoose";

import type { AviationNews } from "@/lib/aviation-news/types";
import { dbConnect } from "@/lib/mongodb";
import { IsitClassificationModel, IsitReviewEventModel, IsitSuggestionModel } from "./model";
import type { PreprocessPlan } from "./preprocess";
import { decideScope } from "./scope";
import type { IsitClassification, IsitSuggestion, IsitWorkflowStatus } from "./types";

function serialize(doc: IsitClassification): IsitClassification {
  return { ...doc, _id: String(doc._id), news_id: String(doc.news_id) };
}

/** Creates the ISIT collections and their indexes. Idempotent; the only place they get created. */
export async function ensureIndexes(): Promise<void> {
  await dbConnect();
  for (const model of [IsitClassificationModel, IsitSuggestionModel, IsitReviewEventModel]) {
    await model.createCollection();
    await model.createIndexes();
  }
}

export interface EnsurePendingResult {
  inserted: number;
  existing: number;
}

/**
 * Makes sure every given news item has a classification record. Existing records are never
 * modified (`$setOnInsert` only), so re-running is safe and cannot touch AI or human results.
 */
export async function ensurePending(news: AviationNews[]): Promise<EnsurePendingResult> {
  await dbConnect();
  if (!news.length) return { inserted: 0, existing: 0 };

  const now = new Date();
  const operations = news.map((item) => {
    const scope = decideScope(item);
    if (!scope.inScope) {
      throw new Error(`News ${item._id} is outside the ISIT scope: ${scope.reason}`);
    }
    const newsId = new Types.ObjectId(String(item._id));
    return {
      updateOne: {
        filter: { news_id: newsId },
        update: {
          $setOnInsert: {
            news_id: newsId,
            source_id: item.source_id,
            article_id: scope.articleId,
            input: {
              url: item.url,
              post_url: item.post_url ?? null,
              published_at: item.published_at ?? null,
              fetched_at: item.fetched_at ?? null,
              content_hash: item.content_hash ?? null,
              fingerprint: null,
            },
            dates: { event_date: null, article_created_at: null, article_updated_at: null },
            workflow_status: "pending" as IsitWorkflowStatus,
            flags: [],
            relations: [],
            ai: null,
            final: null,
            created_at: now,
            updated_at: now,
          },
        },
        upsert: true,
      },
    };
  });

  // Timestamps are set in $setOnInsert above; Mongoose's automatic ones would add a $set that
  // bumps updated_at on every re-run.
  const result = await IsitClassificationModel.bulkWrite(operations, { ordered: false, timestamps: false });
  return { inserted: result.upsertedCount, existing: news.length - result.upsertedCount };
}

/** News ids (as strings) that already have a classification record. */
export async function findExistingNewsIds(newsIds: string[]): Promise<Set<string>> {
  await dbConnect();
  const docs = await IsitClassificationModel.find({
    news_id: { $in: newsIds.map((id) => new Types.ObjectId(id)) },
  })
    .select({ news_id: 1 })
    .lean<Pick<IsitClassification, "news_id">[]>();
  return new Set(docs.map((doc) => String(doc.news_id)));
}

export async function findByNewsId(newsId: string): Promise<IsitClassification | null> {
  await dbConnect();
  const doc = await IsitClassificationModel.findOne({ news_id: new Types.ObjectId(newsId) }).lean<IsitClassification>();
  return doc ? serialize(doc) : null;
}

export async function countByStatus(): Promise<Partial<Record<IsitWorkflowStatus, number>>> {
  await dbConnect();
  const rows = await IsitClassificationModel.aggregate<{ _id: IsitWorkflowStatus; n: number }>([
    { $group: { _id: "$workflow_status", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.n]));
}

export async function countBySource(): Promise<Record<string, number>> {
  await dbConnect();
  const rows = await IsitClassificationModel.aggregate<{ _id: string; n: number }>([
    { $group: { _id: "$source_id", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.n]));
}

export async function findByNewsIds(newsIds: string[]): Promise<IsitClassification[]> {
  await dbConnect();
  const docs = await IsitClassificationModel.find({
    news_id: { $in: newsIds.map((id) => new Types.ObjectId(id)) },
  }).lean<IsitClassification[]>();
  return docs.map(serialize);
}

export interface PreprocessWrite {
  newsId: string;
  /** Fingerprint the plan was computed against; the write is skipped if it moved meanwhile. */
  expectedFingerprint: string | null;
  set: PreprocessPlan["set"];
}

/** Applies preprocessing results. Never touches `ai` or `final`. Returns the number of records written. */
export async function applyPreprocess(writes: PreprocessWrite[]): Promise<number> {
  await dbConnect();
  if (!writes.length) return 0;
  const now = new Date();
  const result = await IsitClassificationModel.bulkWrite(
    writes.map((write) => ({
      updateOne: {
        filter: { news_id: new Types.ObjectId(write.newsId), "input.fingerprint": write.expectedFingerprint },
        update: {
          $set: {
            ...write.set,
            relations: write.set.relations.map((relation) => ({
              ...relation,
              news_id: relation.news_id === null ? null : new Types.ObjectId(String(relation.news_id)),
            })),
            updated_at: now,
          },
        },
      },
    })),
    { ordered: false, timestamps: false }
  );
  return result.modifiedCount;
}

/** Identifies an AI configuration: the same input with the same key is never sent twice. */
export interface RunKey {
  input_fingerprint: string;
  taxonomy_version: string;
  model: string;
  prompt_version: string;
}

export interface RunHistory {
  succeeded: boolean;
  failedAttempts: number;
}

/** Per news id: has this exact input already been classified with this configuration, and how often did it fail? */
export async function findRunHistory(
  items: Array<{ newsId: string; fingerprint: string }>,
  key: Omit<RunKey, "input_fingerprint">
): Promise<Map<string, RunHistory>> {
  await dbConnect();
  const rows = await IsitSuggestionModel.aggregate<{ _id: { news_id: Types.ObjectId; fp: string; status: string }; n: number }>([
    {
      $match: {
        news_id: { $in: items.map((item) => new Types.ObjectId(item.newsId)) },
        taxonomy_version: key.taxonomy_version,
        model: key.model,
        prompt_version: key.prompt_version,
      },
    },
    { $group: { _id: { news_id: "$news_id", fp: "$input_fingerprint", status: "$status" }, n: { $sum: 1 } } },
  ]);

  const fingerprintOf = new Map(items.map((item) => [item.newsId, item.fingerprint]));
  const history = new Map<string, RunHistory>(items.map((item) => [item.newsId, { succeeded: false, failedAttempts: 0 }]));
  for (const row of rows) {
    const id = String(row._id.news_id);
    if (row._id.fp !== fingerprintOf.get(id)) continue;
    const entry = history.get(id)!;
    if (row._id.status === "succeeded") entry.succeeded = true;
    else entry.failedAttempts += row.n;
  }
  return history;
}

export interface SaveRunInput {
  newsId: string;
  suggestion: Omit<IsitSuggestion, "_id" | "news_id" | "created_at">;
  /** The record is only updated if its input still has this fingerprint. */
  expectedFingerprint: string;
  flags: string[];
  workflowStatus: IsitWorkflowStatus;
}

/**
 * Stores the run as an immutable suggestion and points the record at it. Never writes `final`
 * and never touches an approved record. A failed run keeps the previous `ai` snapshot.
 */
export async function saveRun(input: SaveRunInput): Promise<{ suggestionId: string; applied: boolean }> {
  await dbConnect();
  const newsId = new Types.ObjectId(input.newsId);
  const suggestion = await IsitSuggestionModel.create({ ...input.suggestion, news_id: newsId });

  const set: Record<string, unknown> = {
    flags: input.flags,
    workflow_status: input.workflowStatus,
    updated_at: new Date(),
  };
  if (input.suggestion.status === "succeeded" && input.suggestion.outcome) {
    set.ai = {
      suggestion_id: suggestion._id,
      outcome: input.suggestion.outcome,
      codes: input.suggestion.codes,
      created_at: suggestion.get("created_at"),
    };
  }

  const result = await IsitClassificationModel.updateOne(
    { news_id: newsId, "input.fingerprint": input.expectedFingerprint, workflow_status: { $ne: "approved" } },
    { $set: set },
    { timestamps: false }
  );
  return { suggestionId: String(suggestion._id), applied: result.modifiedCount === 1 };
}

/** Records that ran out of retries go to review without another AI call. */
export async function markForReview(newsId: string, flags: string[]): Promise<void> {
  await dbConnect();
  await IsitClassificationModel.updateOne(
    { news_id: new Types.ObjectId(newsId), workflow_status: { $nin: ["approved", "stale"] } },
    { $set: { workflow_status: "needs_review", flags, updated_at: new Date() } },
    { timestamps: false }
  );
}

export async function findAllClassifications(): Promise<IsitClassification[]> {
  await dbConnect();
  const docs = await IsitClassificationModel.find({}).lean<IsitClassification[]>();
  return docs.map(serialize);
}
