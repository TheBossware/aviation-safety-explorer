import type { Severity } from "@/lib/shared/types";

/**
 * How an airline relates to a news item:
 * - operator: operates the aircraft involved (two operators = two airlines' aircraft involved)
 * - on_behalf_of: the airline the operator flew for ("... on behalf of Ryanair")
 * - subject: the airline a non-occurrence item is about (orders, deliveries, services)
 */
export type AirlineRole = "operator" | "on_behalf_of" | "subject";

export interface AirlineMention {
  name: string;
  role: AirlineRole;
}

export interface AviationNews {
  _id: string;
  source_id: string;
  source_name: string;
  source_type: string;
  source_category: string;
  title: string;
  title_normalized: string;
  url: string;
  content: string;
  summary: string;
  published_at: string | Date;
  fetched_at: string | Date;
  content_hash: string;
  /** Aircraft type / registration / flight number extracted from the report. */
  source_tags: string[];
  post_url: string | null;
  category: string;
  severity: Severity;
  tags: string[];
  classified_by: string | null;
  classification_reasoning: string | null;
  rule_category: string | null;
  rule_severity: string | null;
  content_note: string | null;
  /**
   * Airlines the item is about: the operator first, then any airline it flew on behalf of
   * (e.g. ["Malta Air", "Ryanair"]). `[]` = checked, none named; missing = not checked yet
   * (items ingested after the extraction ran).
   */
  airlines?: string[];
  /** Same airlines with their role; `airlines` stays the flat list used for filtering. */
  airline_roles?: AirlineMention[];
  airlines_extracted_by?: string;
  airlines_extracted_at?: string | Date;
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
  /** Exact airline name within `airlines` (operator or the airline flown for). */
  airline?: string;
  /** Order by `published_at`; defaults to `desc` (newest first). */
  sort?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface AviationNewsPage {
  items: AviationNews[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AirlineCount {
  name: string;
  count: number;
}

export interface WeeklySeverityRow {
  /** Monday of the week (UTC), YYYY-MM-DD. */
  week: string;
  severity: Severity;
  count: number;
}

export interface SourceActivity {
  /** `source_id`, what the list's `?source=` filter takes. */
  sourceId: string;
  source: string;
  total: number;
  bySeverity: Partial<Record<Severity, number>>;
  lastFetchedAt: Date | null;
  lastPublishedAt: Date | null;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface AirlineExtraction {
  airlines: string[];
  roles: AirlineMention[];
  extractedBy: string;
}
