import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import type { CountRow, DashboardData, WeeklyPoint } from "@/lib/dashboard/types";
import * as isitRepository from "@/lib/isit-classification/repository";
import { currentProposal } from "@/lib/isit-classification/review";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import * as sourcesRepository from "@/lib/sources/repository";
import { SEVERITY_VALUES, type Severity } from "@/lib/shared/types";

/** Weeks shown in the weekly volume chart. */
const WEEKS = 12;
const DAY_MS = 24 * 60 * 60 * 1000;
const HIGH_SEVERITIES: Severity[] = ["HIGH", "CRITICAL"];
const TOP_AIRLINES = 10;
const TOP_CODES = 8;

/** Monday 00:00 UTC of the week containing `date`. */
function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

function topCounts(counts: Map<string, { label: string; count: number; hint?: string }>, limit?: number): CountRow[] {
  const rows = [...counts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return limit ? rows.slice(0, limit) : rows;
}

function increment(map: Map<string, { label: string; count: number; hint?: string }>, key: string, label: string, hint?: string) {
  const entry = map.get(key);
  if (entry) entry.count += 1;
  else map.set(key, { label, count: 1, hint });
}

async function isitSummary(): Promise<DashboardData["isit"]> {
  const records = await isitRepository.findForDashboard();
  const taxonomy = loadIsitTaxonomy();

  const status: DashboardData["isit"]["status"] = {};
  const outcomes: DashboardData["isit"]["outcomes"] = {};
  const groups = new Map<string, { label: string; count: number }>();
  const eventCodes = new Map<string, { label: string; count: number; hint?: string }>();
  const contextCodes = new Map<string, { label: string; count: number; hint?: string }>();
  const flags = new Map<string, { label: string; count: number }>();

  for (const record of records) {
    status[record.workflow_status] = (status[record.workflow_status] ?? 0) + 1;
    for (const flag of record.flags) increment(flags, flag, flag);

    // The current result: the reviewer's if approved, otherwise the AI suggestion.
    const { outcome, codes } = currentProposal(record);
    if (outcome) outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;

    const recordGroups = new Set<string>();
    for (const code of codes) {
      const node = taxonomy.getNode(code.code);
      const chain = taxonomy.ancestors(code.code);
      const group = chain[chain.length - 1];
      const name = node?.name ?? code.label;
      if (code.dimension === "event") {
        // Leaf names like "FOPS Non-Normal/Checklists" only make sense with their event type (level 2).
        const eventType = chain.length >= 2 ? chain[chain.length - 2] : group;
        increment(eventCodes, code.code, name, eventType?.name);
        if (group) recordGroups.add(group.code);
      } else if (code.dimension === "context") {
        const parent = chain[0];
        increment(contextCodes, code.code, name, parent?.name);
      }
    }
    for (const groupCode of recordGroups) {
      increment(groups, groupCode, taxonomy.getNode(groupCode)?.name ?? groupCode);
    }
  }

  return {
    total: records.length,
    status,
    outcomes,
    groups: topCounts(groups),
    eventCodes: topCounts(eventCodes, TOP_CODES),
    contextCodes: topCounts(contextCodes, TOP_CODES),
    flags: topCounts(flags),
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  const firstWeek = weekStart(new Date(now - (WEEKS - 1) * 7 * DAY_MS));

  const [total, fetchedLast14d, fetchedLast7d, highLast30d, weeklyRows, activity, activeSources, categories, airlines, recentHigh, isit] =
    await Promise.all([
      aviationNewsRepository.countAll(),
      aviationNewsRepository.countFetchedSince(new Date(now - 14 * DAY_MS)),
      aviationNewsRepository.countFetchedSince(new Date(now - 7 * DAY_MS)),
      aviationNewsRepository.countPublishedSince(new Date(now - 30 * DAY_MS), HIGH_SEVERITIES),
      aviationNewsRepository.weeklySeverityCounts(firstWeek),
      aviationNewsRepository.sourceActivity(),
      sourcesRepository.findActive(),
      aviationNewsRepository.countByCategory(),
      aviationNewsRepository.airlineCounts(),
      aviationNewsRepository.findRecent(8, { severity: HIGH_SEVERITIES }),
      isitSummary(),
    ]);

  // Every week in range, zero-filled, so quiet weeks show as gaps rather than disappearing.
  const weekly = new Map<string, WeeklyPoint>();
  for (let i = 0; i < WEEKS; i++) {
    const week = new Date(firstWeek.getTime() + i * 7 * DAY_MS).toISOString().slice(0, 10);
    weekly.set(week, { week, ...(Object.fromEntries(SEVERITY_VALUES.map((s) => [s, 0])) as Record<Severity, number>) });
  }
  for (const row of weeklyRows) {
    const point = weekly.get(row.week);
    if (point && row.severity in point) point[row.severity] += row.count;
  }

  const withItems = new Set(activity.map((row) => row.sourceId));
  const silentSources = activeSources.filter((source) => !withItems.has(source.id));

  return {
    lastIngestAt: activity.reduce<Date | null>(
      (latest, row) => (row.lastFetchedAt && (!latest || row.lastFetchedAt > latest) ? row.lastFetchedAt : latest),
      null
    ),
    news: {
      total,
      fetchedLast7d,
      fetchedPrev7d: fetchedLast14d - fetchedLast7d,
      highLast30d,
    },
    weekly: [...weekly.values()],
    sources: {
      rows: [
        ...activity,
        ...silentSources.map((source) => ({
          sourceId: source.id,
          source: source.name,
          total: 0,
          bySeverity: {},
          lastFetchedAt: null,
          lastPublishedAt: null,
        })),
      ],
      activeCount: activeSources.length,
      silent: silentSources.map((source) => source.name),
    },
    categories: categories.map((row) => ({ key: row.category, label: row.category, count: row.count })),
    airlines: [...airlines]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, TOP_AIRLINES)
      .map((row) => ({ key: row.name, label: row.name, count: row.count })),
    recentHigh,
    isit,
  };
}
