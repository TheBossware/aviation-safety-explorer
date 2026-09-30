import { Types } from "mongoose";

import { AVIATION_NEWS_COLLECTION } from "@/lib/aviation-news/model";
import type { AviationNews } from "@/lib/aviation-news/types";
import { dbConnect } from "@/lib/mongodb";
import {
  IsitClassificationModel,
  IsitReviewEventModel,
  IsitSuggestionModel,
  type IsitClassificationDocument,
  type IsitReviewEventDocument,
} from "./model";
import { INPUT_CHANGED_FLAG, type PreprocessPlan } from "./preprocess";
import type { ReviewEventDraft } from "./review";
import { decideScope } from "./scope";
import type {
  IsitClassification,
  IsitFinal,
  IsitOutcome,
  IsitReviewEvent,
  IsitSuggestion,
  IsitWorkflowStatus,
} from "./types";

/*
 * Stored documents use ObjectIds; the app gets plain string ids (React Server Components can't pass
 * ObjectId instances to Client Components, and strings compare with ===). Writes convert back.
 */

function serializeAi(ai: IsitClassificationDocument["ai"]): IsitClassification["ai"] {
  return ai ? { ...ai, suggestion_id: String(ai.suggestion_id) } : null;
}

function serialize(doc: IsitClassificationDocument): IsitClassification {
  return {
    ...doc,
    _id: String(doc._id),
    news_id: String(doc.news_id),
    relations: doc.relations.map((relation) => ({
      ...relation,
      news_id: relation.news_id === null ? null : String(relation.news_id),
    })),
    ai: serializeAi(doc.ai),
  };
}

function serializeEvent(doc: IsitReviewEventDocument): IsitReviewEvent {
  return {
    ...doc,
    _id: String(doc._id),
    news_id: String(doc.news_id),
    suggestion_id: doc.suggestion_id === null ? null : String(doc.suggestion_id),
  };
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
    // Deliberately re-checked here although callers already filter: this is the only writer of new
    // records into a DB shared with n8n, so an out-of-scope item must never get through, whatever
    // the caller did. Throwing before bulkWrite means nothing of the batch is written.
    const scope = decideScope(item);
    if (!scope.inScope) {
      throw new Error(`News ${item._id} is outside the ISIT scope: ${scope.reason}`);
    }
    const newsId = new Types.ObjectId(item._id);
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
    .lean<Pick<IsitClassificationDocument, "news_id">[]>();
  return new Set(docs.map((doc) => String(doc.news_id)));
}

export async function findByNewsId(newsId: string): Promise<IsitClassification | null> {
  await dbConnect();
  const doc = await IsitClassificationModel.findOne({ news_id: new Types.ObjectId(newsId) }).lean<IsitClassificationDocument>();
  return doc ? serialize(doc) : null;
}

export async function countByStatus(): Promise<Partial<Record<IsitWorkflowStatus, number>>> {
  await dbConnect();
  const rows = await IsitClassificationModel.aggregate<{ _id: IsitWorkflowStatus; n: number }>([
    { $group: { _id: "$workflow_status", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((row) => [row._id, row.n]));
}

export async function findByNewsIds(newsIds: string[]): Promise<IsitClassification[]> {
  await dbConnect();
  const docs = await IsitClassificationModel.find({
    news_id: { $in: newsIds.map((id) => new Types.ObjectId(id)) },
  }).lean<IsitClassificationDocument[]>();
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
              news_id: relation.news_id === null ? null : new Types.ObjectId(relation.news_id),
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
  const docs = await IsitClassificationModel.find({}).lean<IsitClassificationDocument[]>();
  return docs.map(serialize);
}

export type DashboardClassification = Pick<IsitClassification, "workflow_status" | "flags" | "ai" | "final">;

/** Every record with only what the dashboard aggregates (no input snapshot). */
export async function findForDashboard(): Promise<DashboardClassification[]> {
  await dbConnect();
  const docs = await IsitClassificationModel.find({}, { _id: 0, workflow_status: 1, flags: 1, ai: 1, final: 1 }).lean<
    Pick<IsitClassificationDocument, "workflow_status" | "flags" | "ai" | "final">[]
  >();
  return docs.map((doc) => ({ ...doc, ai: serializeAi(doc.ai) }));
}

export interface ReviewListRow {
  newsId: string;
  title: string;
  publishedAt: Date | null;
  workflowStatus: IsitWorkflowStatus;
  aiOutcome: IsitOutcome | null;
  aiCodeCount: number;
  finalOutcome: IsitOutcome | null;
  flags: string[];
}

/** Review queue joined with the news titles, newest post first. */
export async function findForReview(filter: { status?: IsitWorkflowStatus } = {}): Promise<ReviewListRow[]> {
  await dbConnect();
  const rows = await IsitClassificationModel.aggregate<{
    news_id: Types.ObjectId;
    workflow_status: IsitWorkflowStatus;
    flags: string[];
    ai: IsitClassificationDocument["ai"];
    final: IsitClassificationDocument["final"];
    news: Array<{ title: string; published_at: Date | null }>;
  }>([
    { $match: filter.status ? { workflow_status: filter.status } : {} },
    { $lookup: { from: AVIATION_NEWS_COLLECTION, localField: "news_id", foreignField: "_id", as: "news" } },
    { $project: { news_id: 1, workflow_status: 1, flags: 1, ai: 1, final: 1, "news.title": 1, "news.published_at": 1 } },
    { $sort: { "news.published_at": -1 } },
  ]);
  return rows.map((row) => ({
    newsId: String(row.news_id),
    title: row.news[0]?.title ?? "(news item missing)",
    publishedAt: row.news[0]?.published_at ?? null,
    workflowStatus: row.workflow_status,
    aiOutcome: row.ai?.outcome ?? null,
    aiCodeCount: row.ai?.codes.length ?? 0,
    finalOutcome: row.final?.outcome ?? null,
    flags: row.flags,
  }));
}

export async function findSuggestionById(id: string): Promise<IsitSuggestion | null> {
  await dbConnect();
  return IsitSuggestionModel.findById(id).lean<IsitSuggestion>();
}

export async function findReviewEvents(newsId: string): Promise<IsitReviewEvent[]> {
  await dbConnect();
  const docs = await IsitReviewEventModel.find({ news_id: new Types.ObjectId(newsId) })
    .sort({ at: -1 })
    .lean<IsitReviewEventDocument[]>();
  return docs.map(serializeEvent);
}

/**
 * Stores a human decision: the only writer of `final`. Clears `input_changed` (the reviewer saw
 * the current input) and appends the history events.
 */
export async function saveReview(newsId: string, final: IsitFinal, events: ReviewEventDraft[]): Promise<boolean> {
  await dbConnect();
  const id = new Types.ObjectId(newsId);
  const toObjectId = (value: string | null) => (value ? new Types.ObjectId(value) : null);
  const now = new Date();

  const result = await IsitClassificationModel.updateOne(
    { news_id: id },
    {
      $set: {
        final,
        workflow_status: "approved",
        updated_at: now,
      },
      $pull: { flags: INPUT_CHANGED_FLAG },
    },
    { timestamps: false }
  );
  if (result.matchedCount !== 1) return false;

  await IsitReviewEventModel.insertMany(
    events.map((event) => ({ ...event, news_id: id, suggestion_id: toObjectId(event.suggestion_id), at: now }))
  );
  return true;
}

export type SuggestionUsageRow = Pick<IsitSuggestion, "model" | "status" | "usage" | "created_at">;

/** Token usage of every AI run, for cost reporting. */
export async function findSuggestionUsage(): Promise<SuggestionUsageRow[]> {
  await dbConnect();
  return IsitSuggestionModel.find({})
    .select({ model: 1, status: 1, usage: 1, created_at: 1 })
    .sort({ created_at: 1 })
    .lean<SuggestionUsageRow[]>();
}
