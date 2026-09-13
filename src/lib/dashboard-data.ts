import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import type {
  DailyVolumeRow,
  SeverityCount,
  SourceCount,
} from "@/lib/aviation-news/repository";
import * as sourcesRepository from "@/lib/sources/repository";
import type { AviationNews } from "@/lib/aviation-news/types";

const DAILY_VOLUME_DAYS = 14;
const TOP_SOURCE_LIMIT = 5;
const OTHER_KEY = "Other";

export interface DashboardCounts {
  aviationNews: number;
  activeSources: number;
}

export interface DailyVolumePoint {
  date: string;
  [source: string]: string | number;
}

export interface DashboardData {
  counts: DashboardCounts;
  recentNews: AviationNews[];
  dailyVolume: DailyVolumePoint[];
  /** Sources shown as their own series in the daily volume chart, in rank order. */
  topSources: string[];
  sourceBreakdown: SourceCount[];
  severityBreakdown: SeverityCount[];
}

function buildDayRange(days: number): string[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(start);
    day.setDate(day.getDate() - i);
    result.push(day.toISOString().slice(0, 10));
  }
  return result;
}

/** Pivots (date, source, count) rows into one row per day with a column per top source. */
function pivotDailyVolume(
  rows: DailyVolumeRow[],
  topSources: string[],
  days: number
): DailyVolumePoint[] {
  const topSet = new Set(topSources);
  const dayKeys = buildDayRange(days);
  const byDate = new Map<string, DailyVolumePoint>(dayKeys.map((date) => [date, { date }]));

  for (const row of rows) {
    const point = byDate.get(row.date);
    if (!point) continue;
    const key = topSet.has(row.source) ? row.source : OTHER_KEY;
    point[key] = (Number(point[key]) || 0) + row.count;
  }

  return dayKeys.map((date) => byDate.get(date)!);
}

/** Keeps the top N sources distinct and folds the rest into a single "Other" bucket. */
function foldIntoOther(counts: SourceCount[], limit: number): SourceCount[] {
  if (counts.length <= limit) return counts;
  const top = counts.slice(0, limit);
  const otherTotal = counts.slice(limit).reduce((sum, c) => sum + c.count, 0);
  return [...top, { source: OTHER_KEY, count: otherTotal }];
}

export async function getDashboardData(): Promise<DashboardData> {
  const [aviationNews, activeSources, recentNews, dailyRows, sourceCounts, severityCounts] =
    await Promise.all([
      aviationNewsRepository.count(),
      sourcesRepository.count({ active: true }),
      aviationNewsRepository.findRecent(10),
      aviationNewsRepository.dailyVolumeBySource(DAILY_VOLUME_DAYS),
      aviationNewsRepository.countGroupedBySource(),
      aviationNewsRepository.countGroupedBySeverity(),
    ]);

  const topSources = sourceCounts.slice(0, TOP_SOURCE_LIMIT).map((row) => row.source);

  return {
    counts: { aviationNews, activeSources },
    recentNews,
    dailyVolume: pivotDailyVolume(dailyRows, topSources, DAILY_VOLUME_DAYS),
    topSources,
    sourceBreakdown: foldIntoOther(sourceCounts, TOP_SOURCE_LIMIT),
    severityBreakdown: severityCounts,
  };
}
