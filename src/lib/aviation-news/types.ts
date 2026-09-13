import type { Severity } from "@/lib/shared/types";

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
  fr_type: string | null;
  is_proposed: boolean | null;
  effective_on: string | Date | null;
  content_note: string | null;
}
