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
