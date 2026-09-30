/**
 * Turns the aviation-news list URL (`?severity=HIGH&range=30d&page=2`) into a repository filter.
 * Client-safe: the filter components import the option lists from here.
 */
import { isOneOf } from "@/lib/shared/guards";
import { toArray, toSingle, type SearchParams } from "@/lib/shared/search-params";
import { SEVERITY_VALUES, type Severity } from "@/lib/shared/types";
import type { AviationNewsFilter } from "./types";

/** The value Select components use for "no filter". */
export const ALL = "All";

/** Date range options, in menu order. Every value except `ALL` needs a case in `publishedAfterFromRange`. */
export const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 1 year" },
  { value: ALL, label: "All time" },
] as const;

function normalize(value: string | undefined): string | undefined {
  return value && value !== ALL ? value : undefined;
}

function toSeverityFilter(value: string | string[] | undefined): Severity[] {
  return toArray(value).filter((v): v is Severity => isOneOf(SEVERITY_VALUES, v));
}

function toSortOrder(value: string | undefined): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

/** Start of a date range, counted back from `now` in the local calendar; undefined for no/unknown range. */
function publishedAfterFromRange(range: string | undefined, now: Date): Date | undefined {
  if (!range) return undefined;
  const from = new Date(now);
  switch (range) {
    case "7d":
      from.setDate(from.getDate() - 7);
      return from;
    case "30d":
      from.setDate(from.getDate() - 30);
      return from;
    case "90d":
      from.setDate(from.getDate() - 90);
      return from;
    case "6m":
      from.setMonth(from.getMonth() - 6);
      return from;
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      return from;
    default:
      return undefined;
  }
}

export function parseAviationNewsFilter(params: SearchParams, now: Date = new Date()): AviationNewsFilter {
  return {
    category: normalize(toSingle(params.category)),
    severity: toSeverityFilter(params.severity),
    sourceId: normalize(toSingle(params.source)),
    publishedAfter: publishedAfterFromRange(normalize(toSingle(params.range)), now),
    q: toSingle(params.q),
    aircraft: toSingle(params.aircraft),
    tag: toSingle(params.tag),
    airline: normalize(toSingle(params.airline)),
    sort: toSortOrder(toSingle(params.sort)),
    page: Number(toSingle(params.page)) || 1,
  };
}
