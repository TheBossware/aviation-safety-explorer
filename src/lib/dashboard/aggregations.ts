/**
 * The dashboard's calculations over data already loaded from the repositories. No I/O here, so
 * every number the dashboard shows can be unit-tested.
 */
import type { AirlineCount, SourceActivity, WeeklySeverityRow } from "@/lib/aviation-news/types";
import type { DashboardClassification } from "@/lib/isit-classification/repository";
import { currentProposal } from "@/lib/isit-classification/review";
import type { IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { SEVERITY_VALUES, type Severity } from "@/lib/shared/types";
import type { Source } from "@/lib/sources/types";
import type { CountRow, DashboardData, WeeklyPoint } from "./types";

export const DAY_MS = 24 * 60 * 60 * 1000;

type Tally = Map<string, { label: string; count: number; hint?: string }>;

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/**
 * One point per week from `firstWeek`, `weeks` long, with every severity present. Quiet weeks stay
 * in as zeros so they show as gaps instead of disappearing; rows outside the range are ignored.
 */
export function zeroFilledWeeks(firstWeek: Date, weeks: number, rows: WeeklySeverityRow[]): WeeklyPoint[] {
  const weekly = new Map<string, WeeklyPoint>();
  for (let i = 0; i < weeks; i++) {
    const week = new Date(firstWeek.getTime() + i * 7 * DAY_MS).toISOString().slice(0, 10);
    weekly.set(week, { week, ...(Object.fromEntries(SEVERITY_VALUES.map((s) => [s, 0])) as Record<Severity, number>) });
  }
  for (const row of rows) {
    const point = weekly.get(row.week);
    if (point && row.severity in point) point[row.severity] += row.count;
  }
  return [...weekly.values()];
}

/** When n8n last delivered anything, over all sources. */
export function latestFetch(activity: SourceActivity[]): Date | null {
  return activity.reduce<Date | null>(
    (latest, row) => (row.lastFetchedAt && (!latest || row.lastFetchedAt > latest) ? row.lastFetchedAt : latest),
    null
  );
}

/** Sources with items, followed by active sources that have never delivered one (as empty rows). */
export function sourceOverview(activity: SourceActivity[], activeSources: Source[]): DashboardData["sources"] {
  const withItems = new Set(activity.map((row) => row.sourceId));
  const silentSources = activeSources.filter((source) => !withItems.has(source.id));
  return {
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
  };
}

/** The `limit` most mentioned airlines, ties alphabetical. */
export function topAirlines(airlines: AirlineCount[], limit: number): CountRow[] {
  return [...airlines]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((row) => ({ key: row.name, label: row.name, count: row.count }));
}

function topCounts(counts: Tally, limit?: number): CountRow[] {
  const rows = [...counts.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return limit ? rows.slice(0, limit) : rows;
}

function increment(map: Tally, key: string, label: string, hint?: string) {
  const entry = map.get(key);
  if (entry) entry.count += 1;
  else map.set(key, { label, count: 1, hint });
}

/**
 * Status, outcome, group, code and flag counts over every ISIT record. Each record counts with its
 * current result: the reviewer's if approved, otherwise the AI suggestion.
 */
export function summarizeIsit(
  records: DashboardClassification[],
  taxonomy: IsitTaxonomy,
  topCodes: number
): DashboardData["isit"] {
  const status: DashboardData["isit"]["status"] = {};
  const outcomes: DashboardData["isit"]["outcomes"] = {};
  const groups: Tally = new Map();
  const eventCodes: Tally = new Map();
  const contextCodes: Tally = new Map();
  const flags: Tally = new Map();

  for (const record of records) {
    status[record.workflow_status] = (status[record.workflow_status] ?? 0) + 1;
    for (const flag of record.flags) increment(flags, flag, flag);

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
    eventCodes: topCounts(eventCodes, topCodes),
    contextCodes: topCounts(contextCodes, topCodes),
    flags: topCounts(flags),
  };
}
