/**
 * Everything the dashboard page shows, loaded in one parallel round of queries. The calculations
 * live in `aggregations.ts`; this file only decides what to load and how to combine it.
 */
import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import type { Severity } from "@/lib/shared/types";
import * as sourcesRepository from "@/lib/sources/repository";
import {
  DAY_MS,
  latestFetch,
  sourceOverview,
  summarizeIsit,
  topAirlines,
  weekStart,
  zeroFilledWeeks,
} from "./aggregations";
import type { DashboardData } from "./types";

/** Weeks shown in the weekly volume chart. */
const WEEKS = 12;
const HIGH_SEVERITIES: Severity[] = ["HIGH", "CRITICAL"];
const RECENT_HIGH_ITEMS = 8;
const TOP_AIRLINES = 10;
const TOP_CODES = 8;

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  const firstWeek = weekStart(new Date(now - (WEEKS - 1) * 7 * DAY_MS));

  const [
    total,
    fetchedLast14d,
    fetchedLast7d,
    highLast30d,
    weeklyRows,
    activity,
    activeSources,
    categories,
    airlines,
    recentHigh,
    isitRecords,
  ] = await Promise.all([
    aviationNewsRepository.countAll(),
    aviationNewsRepository.countFetchedSince(new Date(now - 14 * DAY_MS)),
    aviationNewsRepository.countFetchedSince(new Date(now - 7 * DAY_MS)),
    aviationNewsRepository.countPublishedSince(new Date(now - 30 * DAY_MS), HIGH_SEVERITIES),
    aviationNewsRepository.weeklySeverityCounts(firstWeek),
    aviationNewsRepository.sourceActivity(),
    sourcesRepository.findActive(),
    aviationNewsRepository.countByCategory(),
    aviationNewsRepository.airlineCounts(),
    aviationNewsRepository.findRecent(RECENT_HIGH_ITEMS, { severity: HIGH_SEVERITIES }),
    isitRepository.findForDashboard(),
  ]);

  return {
    lastIngestAt: latestFetch(activity),
    news: {
      total,
      fetchedLast7d,
      fetchedPrev7d: fetchedLast14d - fetchedLast7d,
      highLast30d,
    },
    weekly: zeroFilledWeeks(firstWeek, WEEKS, weeklyRows),
    sources: sourceOverview(activity, activeSources),
    categories: categories.map((row) => ({ key: row.category, label: row.category, count: row.count })),
    airlines: topAirlines(airlines, TOP_AIRLINES),
    recentHigh,
    isit: summarizeIsit(isitRecords, loadIsitTaxonomy(), TOP_CODES),
  };
}
