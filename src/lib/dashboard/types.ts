import type { AviationNews, SourceActivity } from "@/lib/aviation-news/types";
import type { IsitOutcome, IsitWorkflowStatus } from "@/lib/isit-classification/types";
import type { Severity } from "@/lib/shared/types";

export type WeeklyPoint = { week: string } & Record<Severity, number>;

export interface CountRow {
  key: string;
  label: string;
  count: number;
  /** Secondary text, e.g. the ISIT group a code belongs to. */
  hint?: string;
}

export interface DashboardData {
  lastIngestAt: Date | null;
  news: {
    total: number;
    fetchedLast7d: number;
    fetchedPrev7d: number;
    highLast30d: number;
  };
  weekly: WeeklyPoint[];
  sources: {
    /** Every source with items, plus active sources without any (total 0). */
    rows: SourceActivity[];
    activeCount: number;
    /** Active sources that have never delivered an item. */
    silent: string[];
  };
  categories: CountRow[];
  airlines: CountRow[];
  recentHigh: AviationNews[];
  isit: {
    total: number;
    status: Partial<Record<IsitWorkflowStatus, number>>;
    outcomes: Partial<Record<IsitOutcome, number>>;
    /** Records per ISIT parent group (level 1) of their event codes. */
    groups: CountRow[];
    eventCodes: CountRow[];
    contextCodes: CountRow[];
    flags: CountRow[];
  };
}
