/**
 * The decisions inside a classify run, without I/O: whether a record goes to the model, and what
 * is stored for its result. `jobs.ts` does the loading, calling and saving around them.
 */
import type { AviationNews } from "@/lib/aviation-news/types";
import { PIPELINE_VERSION, type ClassifyResult } from "./pipeline";
import { preprocess } from "./preprocess";
import type { RunHistory, RunKey, SaveRunInput } from "./repository";

/** Failed AI runs per input before a record goes to human review instead of another attempt. */
export const MAX_ATTEMPTS = 3;

/**
 * - classify           send it to the model
 * - fetched_too_late   ingested after the run's cut-off (`fetchedBefore`)
 * - outdated_input     aviation_news changed since preprocessing; preprocess again first
 * - up_to_date         already classified with this exact input and configuration
 * - retries_exhausted  failed MAX_ATTEMPTS times with this input; goes to review instead
 */
export type ClassifyDecision = "classify" | "fetched_too_late" | "outdated_input" | "up_to_date" | "retries_exhausted";

/** What to do with one preprocessed, not-approved record. Checks run in this order; the first match wins. */
export function decideClassify(
  fingerprint: string,
  news: AviationNews,
  past: RunHistory,
  fetchedBefore?: Date | null
): ClassifyDecision {
  if (fetchedBefore && !(new Date(news.fetched_at) < fetchedBefore)) return "fetched_too_late";
  if (preprocess(news).fingerprint !== fingerprint) return "outdated_input";
  if (past.succeeded) return "up_to_date";
  if (past.failedAttempts >= MAX_ATTEMPTS) return "retries_exhausted";
  return "classify";
}

/** The immutable suggestion stored for one model run (succeeded or failed). */
export function toSuggestion(
  fingerprint: string,
  key: Omit<RunKey, "input_fingerprint">,
  result: ClassifyResult
): SaveRunInput["suggestion"] {
  return {
    status: result.status,
    input_fingerprint: fingerprint,
    ...key,
    pipeline_version: PIPELINE_VERSION,
    outcome: result.outcome,
    codes: result.codes,
    flags: result.flags,
    stages: { ...result.stages, served_models: result.servedModels },
    error: result.error,
    usage: result.usage,
  };
}
