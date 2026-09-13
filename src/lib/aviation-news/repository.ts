import type { QueryFilter } from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import type { Severity } from "@/lib/shared/types";
import { AviationNewsModel } from "./model";
import type { AviationNews } from "./types";

const DEFAULT_PAGE_SIZE = 12;

/** `.lean()` returns `_id` as an ObjectId; normalize to a string everywhere. */
function serialize(doc: AviationNews): AviationNews {
  return { ...doc, _id: String(doc._id) };
}

/** Escapes regex metacharacters so free-text search can't be used to inject a pattern. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface AviationNewsFilter {
  category?: string;
  severity?: Severity[];
  sourceId?: string;
  /** Only include reports published on or after this date. */
  publishedAfter?: Date;
  /** Free-text search across title, summary and aircraft/flight tags. */
  q?: string;
  /** Matches within `source_tags` (aircraft type, registration, flight number). */
  aircraft?: string;
  /** Matches within `tags`. */
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface AviationNewsPage {
  items: AviationNews[];
  total: number;
  page: number;
  pageSize: number;
}

function buildQuery(filter: AviationNewsFilter): QueryFilter<AviationNews> {
  const query: QueryFilter<AviationNews> = {};

  if (filter.category) query.category = filter.category;
  if (filter.severity?.length) query.severity = { $in: filter.severity };
  if (filter.sourceId) query.source_id = filter.sourceId;
  if (filter.publishedAfter) query.published_at = { $gte: filter.publishedAfter };
  if (filter.aircraft) {
    query.source_tags = { $regex: escapeRegex(filter.aircraft), $options: "i" };
  }
  if (filter.tag) {
    query.tags = { $regex: escapeRegex(filter.tag), $options: "i" };
  }
  if (filter.q) {
    const regex = new RegExp(escapeRegex(filter.q), "i");
    query.$or = [{ title: regex }, { summary: regex }, { source_tags: regex }];
  }

  return query;
}

export async function findFiltered(filter: AviationNewsFilter): Promise<AviationNewsPage> {
  await dbConnect();

  const query = buildQuery(filter);
  const page = filter.page && filter.page > 0 ? filter.page : 1;
  const pageSize = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : DEFAULT_PAGE_SIZE;

  const [docs, total] = await Promise.all([
    AviationNewsModel.find(query)
      .sort({ published_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<AviationNews[]>(),
    AviationNewsModel.countDocuments(query),
  ]);

  return { items: docs.map(serialize), total, page, pageSize };
}

export async function findRecent(limit: number): Promise<AviationNews[]> {
  await dbConnect();
  const docs = await AviationNewsModel.find()
    .sort({ published_at: -1 })
    .limit(limit)
    .lean<AviationNews[]>();
  return docs.map(serialize);
}

export async function findById(id: string): Promise<AviationNews | null> {
  await dbConnect();
  const doc = await AviationNewsModel.findById(id).lean<AviationNews>();
  return doc ? serialize(doc) : null;
}

export async function distinctCategories(): Promise<string[]> {
  await dbConnect();
  const categories = await AviationNewsModel.distinct("category");
  return categories.filter(Boolean).sort();
}

export async function count(filter: Partial<AviationNews> = {}): Promise<number> {
  await dbConnect();
  return AviationNewsModel.countDocuments(filter);
}

export interface DailyVolumeRow {
  date: string; // YYYY-MM-DD
  source: string;
  count: number;
}

/** Daily ingestion volume per source (by `fetched_at`, i.e. when this app's pipeline received it). */
export async function dailyVolumeBySource(days: number): Promise<DailyVolumeRow[]> {
  await dbConnect();
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const docs = await AviationNewsModel.find({ fetched_at: { $gte: since } })
    .select({ fetched_at: 1, source_name: 1 })
    .lean<Pick<AviationNews, "fetched_at" | "source_name">[]>();

  const counts = new Map<string, number>();
  for (const doc of docs) {
    const date = new Date(doc.fetched_at).toISOString().slice(0, 10);
    const key = `${date}::${doc.source_name}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const [date, source] = key.split("::");
    return { date, source, count };
  });
}

export interface SourceCount {
  source: string;
  count: number;
}

export async function countGroupedBySource(): Promise<SourceCount[]> {
  await dbConnect();
  const docs = await AviationNewsModel.find()
    .select({ source_name: 1 })
    .lean<Pick<AviationNews, "source_name">[]>();

  const counts = new Map<string, number>();
  for (const doc of docs) {
    counts.set(doc.source_name, (counts.get(doc.source_name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

export interface SeverityCount {
  severity: Severity;
  count: number;
}

export async function countGroupedBySeverity(): Promise<SeverityCount[]> {
  await dbConnect();
  const docs = await AviationNewsModel.find().select({ severity: 1 }).lean<Pick<AviationNews, "severity">[]>();

  const counts = new Map<Severity, number>();
  for (const doc of docs) {
    counts.set(doc.severity, (counts.get(doc.severity) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([severity, count]) => ({ severity, count }));
}
