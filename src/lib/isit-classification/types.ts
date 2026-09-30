import type { ObjectId } from "mongodb";

import type { IsitDimension } from "@/lib/isit-taxonomy/types";

/**
 * Only this source enters the ISIT pipeline. `source_id` is the reliable key (`source_name`
 * is display text); the article URL host is checked as well before a record is created.
 */
export const ISIT_SOURCE_ID = "avherald";
export const ISIT_SOURCE_HOST = "avherald.com";

/**
 * What the news item is, as far as ISIT is concerned.
 * - classified            at least one valid ISIT code applies
 * - not_applicable        not an occurrence (e.g. "News: AVH was sued")
 * - insufficient_evidence an occurrence, but the text supports no code, not even at level 2
 * - revoked               the source withdrew the claim; no event codes are asserted
 */
export type IsitOutcome = "classified" | "not_applicable" | "insufficient_evidence" | "revoked";

export const ISIT_OUTCOME_VALUES: readonly IsitOutcome[] = [
  "classified",
  "not_applicable",
  "insufficient_evidence",
  "revoked",
];

export const OUTCOME_LABELS: Record<IsitOutcome, string> = {
  classified: "Classified",
  not_applicable: "Not applicable",
  insufficient_evidence: "Insufficient evidence",
  revoked: "Revoked",
};

/**
 * Where the record is in the pipeline.
 * - pending       awaiting an AI run
 * - ai_failed     last AI run errored; retried by the next batch
 * - ai_suggested  AI result stored, nothing flagged; not yet human-approved
 * - needs_review  flagged (revocation, conflict, date anomaly, dropped code, low confidence...)
 * - approved      a human set `final`; batches never overwrite it
 * - stale         approved, but the input or taxonomy changed since; `final` is kept until re-reviewed
 */
export type IsitWorkflowStatus = "pending" | "ai_failed" | "ai_suggested" | "needs_review" | "approved" | "stale";

export const ISIT_WORKFLOW_STATUS_VALUES: readonly IsitWorkflowStatus[] = [
  "pending",
  "ai_failed",
  "ai_suggested",
  "needs_review",
  "approved",
  "stale",
];

export const WORKFLOW_STATUS_LABELS: Record<IsitWorkflowStatus, string> = {
  pending: "Pending",
  ai_failed: "AI failed",
  ai_suggested: "AI suggested",
  needs_review: "Needs review",
  approved: "Approved",
  stale: "Stale",
};

export type IsitRelationType = "revokes" | "updates" | "same_article" | "possible_duplicate";

export const ISIT_RELATION_TYPE_VALUES: readonly IsitRelationType[] = [
  "revokes",
  "updates",
  "same_article",
  "possible_duplicate",
];

/** A link to another news record. Suggested by the pipeline, never acted on until `confirmed`. */
export interface IsitRelation {
  type: IsitRelationType;
  news_id: ObjectId | string | null;
  /** AvHerald article id when the related record is not (yet) in `aviation_news`. */
  article_id: string | null;
  confirmed: boolean;
}

export interface IsitCodeAssignment {
  code: string;
  dimension: IsitDimension;
  /** Taxonomy label at assignment time, kept for display if the taxonomy changes. */
  label: string;
  /** Verbatim quote from the title or content; required for AI suggestions. */
  evidence_quote: string | null;
  rationale: string | null;
}

/** Snapshot of the `aviation_news` fields the classification was based on. */
export interface IsitInputSnapshot {
  url: string;
  post_url: string | null;
  published_at: Date | string | null;
  fetched_at: Date | string | null;
  /** n8n's djb2(url|title_normalized): informational only, it ignores content changes. */
  content_hash: string | null;
  /** Our own hash over title, summary, content and url; set by preprocessing. */
  fingerprint: string | null;
}

/** Dates are kept apart on purpose: none of them substitutes for another. */
export interface IsitDates {
  /** Occurrence date from the title ("on Aug 10th 2026"). */
  event_date: Date | string | null;
  /** From the article header in `content` ("created ..., last updated ..."). */
  article_created_at: Date | string | null;
  article_updated_at: Date | string | null;
}

export interface IsitAiSnapshot {
  suggestion_id: ObjectId | string;
  outcome: IsitOutcome;
  codes: IsitCodeAssignment[];
  created_at: Date | string;
}

export interface IsitFinal {
  outcome: IsitOutcome;
  codes: IsitCodeAssignment[];
  taxonomy_version: string;
  /** Unverified until auth exists: whatever name the reviewer entered. */
  approved_by: string;
  approved_at: Date | string;
  note: string | null;
}

export interface IsitClassification {
  _id: ObjectId | string;
  news_id: ObjectId | string;
  source_id: string;
  /** AvHerald article id from `url` (`h?article=<hex>`). Shared by revocations and the post they revoke. */
  article_id: string | null;
  input: IsitInputSnapshot;
  dates: IsitDates;
  workflow_status: IsitWorkflowStatus;
  flags: string[];
  relations: IsitRelation[];
  /** Latest AI suggestion (full history in `isit_suggestions`). */
  ai: IsitAiSnapshot | null;
  /** Human-approved result; only review actions write it. */
  final: IsitFinal | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export type IsitSuggestionStatus = "succeeded" | "failed";

/** One immutable AI run. */
export interface IsitSuggestion {
  _id: ObjectId | string;
  news_id: ObjectId | string;
  status: IsitSuggestionStatus;
  input_fingerprint: string;
  taxonomy_version: string;
  model: string;
  prompt_version: string;
  pipeline_version: string;
  outcome: IsitOutcome | null;
  codes: IsitCodeAssignment[];
  flags: string[];
  /** Raw per-stage model output and validation results, for audit and evaluation. */
  stages: Record<string, unknown>;
  error: string | null;
  /**
   * Tokens billed for the run, summed over its stages. Cache fields exist on suggestions created
   * after 2026-09-29 ~09:30 UTC; older ones only have input/output (their cache reads are missing).
   */
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  } | null;
  created_at?: Date | string;
}

export type IsitReviewAction =
  | "approve"
  | "reject_code"
  | "add_code"
  | "replace_code"
  | "set_outcome"
  | "confirm_relation"
  | "comment";

export const ISIT_REVIEW_ACTION_VALUES: readonly IsitReviewAction[] = [
  "approve",
  "reject_code",
  "add_code",
  "replace_code",
  "set_outcome",
  "confirm_relation",
  "comment",
];

/** Append-only review history. */
export interface IsitReviewEvent {
  _id: ObjectId | string;
  news_id: ObjectId | string;
  action: IsitReviewAction;
  actor: string;
  before: unknown;
  after: unknown;
  comment: string | null;
  suggestion_id: ObjectId | string | null;
  at: Date | string;
}
