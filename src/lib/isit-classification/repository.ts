import { Types } from "mongoose";

import type { AviationNews } from "@/lib/aviation-news/types";
import { dbConnect } from "@/lib/mongodb";
import { IsitClassificationModel, IsitReviewEventModel, IsitSuggestionModel } from "./model";
import type { PreprocessPlan } from "./preprocess";
import { decideScope } from "./scope";
import type { IsitClassification, IsitWorkflowStatus } from "./types";

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
