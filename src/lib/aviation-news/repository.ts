import type { QueryFilter } from "mongoose";

import { dbConnect } from "@/lib/mongodb";
import type { Severity } from "@/lib/shared/types";
import { AviationNewsModel } from "./model";
import type {
  AirlineCount,
  AviationNews,
  AviationNewsFilter,
  AviationNewsPage,
  CategoryCount,
  SourceActivity,
  WeeklySeverityRow,
} from "./types";

const DEFAULT_PAGE_SIZE = 12;

/** `.lean()` returns `_id` as an ObjectId; normalize to a string everywhere. */
function serialize(doc: AviationNews): AviationNews {
  return { ...doc, _id: String(doc._id) };
}

/** Escapes regex metacharacters so free-text search can't be used to inject a pattern. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQuery(filter: AviationNewsFilter): QueryFilter<AviationNews> {
  const query: QueryFilter<AviationNews> = {};

  if (filter.category) query.category = filter.category;
  if (filter.severity?.length) query.severity = { $in: filter.severity };
  if (filter.sourceId) query.source_id = filter.sourceId;
  if (filter.airline) query.airlines = filter.airline;
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

  const sortDirection = filter.sort === "asc" ? 1 : -1;

  const [docs, total] = await Promise.all([
    AviationNewsModel.find(query)
      .sort({ published_at: sortDirection })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean<AviationNews[]>(),
    AviationNewsModel.countDocuments(query),
  ]);

  return { items: docs.map(serialize), total, page, pageSize };
}

export async function findRecent(limit: number, filter: { severity?: Severity[] } = {}): Promise<AviationNews[]> {
  await dbConnect();
  const docs = await AviationNewsModel.find(filter.severity?.length ? { severity: { $in: filter.severity } } : {})
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

/** Every item of one source, oldest first, unpaginated: for batch jobs, not for pages. */
export async function findAllBySource(sourceId: string): Promise<AviationNews[]> {
  await dbConnect();
  const docs = await AviationNewsModel.find({ source_id: sourceId })
    .sort({ published_at: 1 })
    .lean<AviationNews[]>();
  return docs.map(serialize);
}

/** Every airline named in the news, with how many items mention it, alphabetically. */
export async function airlineCounts(): Promise<AirlineCount[]> {
  await dbConnect();
  const rows = await AviationNewsModel.aggregate<{ _id: string; count: number }>([
    { $match: { "airlines.0": { $exists: true } } },
    { $unwind: "$airlines" },
    { $group: { _id: "$airlines", count: { $sum: 1 } } },
  ]);
  return rows
    .map((row) => ({ name: row._id, count: row.count }))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
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

/** Items whose `field` date is on or after `since`, optionally limited to some severities. */
export async function countSince(
  field: "published_at" | "fetched_at",
  since: Date,
  filter: { severity?: Severity[] } = {}
): Promise<number> {
  await dbConnect();
  return AviationNewsModel.countDocuments({
    [field]: { $gte: since },
    ...(filter.severity?.length ? { severity: { $in: filter.severity } } : {}),
  });
}

/** Items per publication week (Monday-based, UTC) and severity since `since`. */
export async function weeklySeverityCounts(since: Date): Promise<WeeklySeverityRow[]> {
  await dbConnect();
  const rows = await AviationNewsModel.aggregate<{ _id: { week: Date; severity: Severity }; count: number }>([
    { $match: { published_at: { $gte: since } } },
    {
      $group: {
        _id: {
          week: { $dateTrunc: { date: "$published_at", unit: "week", startOfWeek: "monday", timezone: "UTC" } },
          severity: "$severity",
        },
        count: { $sum: 1 },
      },
    },
  ]);
  return rows.map((row) => ({
    week: row._id.week.toISOString().slice(0, 10),
    severity: row._id.severity,
    count: row.count,
  }));
}

/** Per source: item count, severity mix, and when it last delivered something. Busiest first. */
export async function sourceActivity(): Promise<SourceActivity[]> {
  await dbConnect();
  const rows = await AviationNewsModel.aggregate<{
    _id: { sourceId: string; source: string; severity: Severity };
    count: number;
    lastFetchedAt: Date | null;
    lastPublishedAt: Date | null;
  }>([
    {
      $group: {
        _id: { sourceId: "$source_id", source: "$source_name", severity: "$severity" },
        count: { $sum: 1 },
        lastFetchedAt: { $max: "$fetched_at" },
        lastPublishedAt: { $max: "$published_at" },
      },
    },
  ]);

  const bySource = new Map<string, SourceActivity>();
  for (const row of rows) {
    const entry = bySource.get(row._id.sourceId) ?? {
      sourceId: row._id.sourceId,
      source: row._id.source,
      total: 0,
      bySeverity: {},
      lastFetchedAt: null,
      lastPublishedAt: null,
    };
    entry.total += row.count;
    entry.bySeverity[row._id.severity] = (entry.bySeverity[row._id.severity] ?? 0) + row.count;
    if (row.lastFetchedAt && (!entry.lastFetchedAt || row.lastFetchedAt > entry.lastFetchedAt)) {
      entry.lastFetchedAt = row.lastFetchedAt;
    }
    if (row.lastPublishedAt && (!entry.lastPublishedAt || row.lastPublishedAt > entry.lastPublishedAt)) {
      entry.lastPublishedAt = row.lastPublishedAt;
    }
    bySource.set(row._id.sourceId, entry);
  }
  return [...bySource.values()].sort((a, b) => b.total - a.total);
}

/** Items per category, largest first. */
export async function countByCategory(): Promise<CategoryCount[]> {
  await dbConnect();
  const rows = await AviationNewsModel.aggregate<{ _id: string | null; count: number }>([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.filter((row) => row._id).map((row) => ({ category: row._id!, count: row.count }));
}
