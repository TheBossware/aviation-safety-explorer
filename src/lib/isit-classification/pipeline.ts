import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { ISIT_DIMENSIONS, type IsitDimension, type IsitIndexEntry } from "@/lib/isit-taxonomy/types";
import type { IsitModelClient, StageUsage } from "./llm/client";
import { GATE_SYSTEM, recordBlock, routeSystem, SELECT_SYSTEM, selectUser } from "./llm/prompts";
import { GateSchema, RouteSchema, SelectSchema } from "./llm/schemas";
import { INPUT_CHANGED_FLAG, type PreprocessResult } from "./preprocess";
import type { IsitCodeAssignment, IsitOutcome, IsitWorkflowStatus } from "./types";
import { validateRoute, validateSelection } from "./validate";

export const PIPELINE_VERSION = "1";

/** Flags owned by the AI stage: replaced on every run. */
export const AI_FLAGS = [
  /** Gate or deterministic check says the post withdraws an earlier one. */
  "revocation",
  /** Post corrects an earlier one. */
  "correction",
  /** Article does not describe what the title reports. */
  "title_content_conflict",
  /** Deterministic checks and the model disagree (e.g. revocation wording, model says proceed). */
  "gate_conflict",
  /** A returned branch/code failed validation and was dropped. */
  "code_dropped",
  /** Model marked a kept code as low confidence. */
  "low_confidence",
  /** AI call failed; see the failed suggestion's error. */
  "ai_error",
] as const;

/** Any of these (from preprocessing or the AI stage) sends the record to human review. */
const REVIEW_FLAGS = new Set<string>([
  "retraction_candidate",
  "title_references_other_post",
  "date_anomaly",
  "missing_content",
  "missing_event_date",
  "revocation",
  "correction",
  "title_content_conflict",
  "gate_conflict",
  "code_dropped",
  "low_confidence",
  "ai_error",
]);

export interface ClassifyResult {
  status: "succeeded" | "failed";
  outcome: IsitOutcome | null;
  codes: IsitCodeAssignment[];
  /** AI-owned flags from this run. */
  flags: string[];
  stages: Record<string, unknown>;
  error: string | null;
  usage: StageUsage;
  servedModels: string[];
}

function addUsage(total: StageUsage, usage: StageUsage) {
  total.input_tokens += usage.input_tokens;
  total.output_tokens += usage.output_tokens;
  total.cache_read_input_tokens += usage.cache_read_input_tokens;
  total.cache_creation_input_tokens += usage.cache_creation_input_tokens;
}

/**
 * Gate -> route -> select, with every model answer re-validated. A retraction never reaches
 * code assignment, whatever the model says. Does no I/O besides the model client.
 */
export async function classify(
  news: Pick<AviationNews, "title" | "content" | "published_at">,
  pre: PreprocessResult,
  taxonomy: IsitTaxonomy,
  client: IsitModelClient
): Promise<ClassifyResult> {
  const usage: StageUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  const stages: Record<string, unknown> = {};
  const servedModels = new Set<string>();
  const flags = new Set<string>();
  const record = recordBlock(news, pre);
  const sources = [news.title ?? "", news.content ?? ""];

  const done = (outcome: IsitOutcome, codes: IsitCodeAssignment[] = []): ClassifyResult => ({
    status: "succeeded",
    outcome,
    codes,
    flags: [...flags],
    stages,
    error: null,
    usage,
    servedModels: [...servedModels],
  });

  try {
    const gate = await client.run({ stage: "gate", system: GATE_SYSTEM, user: record, schema: GateSchema });
    addUsage(usage, gate.usage);
    servedModels.add(gate.servedModel);
    stages.gate = gate.output;

    const modelSaysRevoked = gate.output.post_type === "revocation" || gate.output.decision === "revoked";
    const preSaysRetraction = pre.flags.includes("retraction_candidate");
    if (!gate.output.title_content_consistent) flags.add("title_content_conflict");

    if (modelSaysRevoked || preSaysRetraction) {
      flags.add("revocation");
      if (modelSaysRevoked !== preSaysRetraction) flags.add("gate_conflict");
      return done("revoked");
    }
    if (gate.output.post_type === "correction") flags.add("correction");

    const preSaysNonOccurrence = pre.flags.includes("non_occurrence_candidate");
    if (gate.output.decision === "not_applicable") {
      if (!preSaysNonOccurrence) flags.add("gate_conflict");
      return done("not_applicable");
    }
    if (preSaysNonOccurrence) flags.add("gate_conflict");
    if (gate.output.decision === "insufficient_evidence") return done("insufficient_evidence");

    const route = await client.run({ stage: "route", system: routeSystem(taxonomy), user: record, schema: RouteSchema });
    addUsage(usage, route.usage);
    servedModels.add(route.servedModel);
    const routed = validateRoute(route.output, taxonomy);
    stages.route = { output: route.output, rejected: routed.rejected };
    if (routed.rejected.length) flags.add("code_dropped");
    if (!routed.branches.event.length) return done("insufficient_evidence");

    const candidates = Object.fromEntries(
      ISIT_DIMENSIONS.map((dimension) => [dimension, routed.branches[dimension].flatMap((branch) => taxonomy.subtree(branch))])
    ) as Record<IsitDimension, IsitIndexEntry[]>;
    const select = await client.run({
      stage: "select",
      system: SELECT_SYSTEM,
      user: selectUser(record, candidates),
      schema: SelectSchema,
    });
    addUsage(usage, select.usage);
    servedModels.add(select.servedModel);
    const selection = validateSelection(select.output, routed.branches, taxonomy, sources);
    stages.select = { output: select.output, rejected: selection.rejected, lowConfidence: selection.lowConfidence };
    if (selection.rejected.length) flags.add("code_dropped");
    if (selection.lowConfidence.length) flags.add("low_confidence");

    if (!selection.accepted.some((code) => code.dimension === "event")) return done("insufficient_evidence", selection.accepted);
    return done("classified", selection.accepted);
  } catch (error) {
    flags.add("ai_error");
    return {
      status: "failed",
      outcome: null,
      codes: [],
      flags: [...flags],
      stages,
      error: error instanceof Error ? error.message : String(error),
      usage,
      servedModels: [...servedModels],
    };
  }
}

/** Merges this run's AI flags into the stored ones, replacing earlier AI flags and clearing `input_changed`. */
export function mergeFlags(stored: string[], aiFlags: string[]): string[] {
  const replaced = new Set<string>([...AI_FLAGS, INPUT_CHANGED_FLAG]);
  return [...stored.filter((flag) => !replaced.has(flag)), ...aiFlags];
}

/**
 * Workflow status after an AI run. A stale record (approved, then its input changed) stays
 * stale: its `final` still stands until a human re-reviews it next to the new suggestion.
 */
export function nextWorkflowStatus(current: IsitWorkflowStatus, result: ClassifyResult, flags: string[]): IsitWorkflowStatus {
  if (current === "approved" || current === "stale") return current;
  if (result.status === "failed") return "ai_failed";
  const needsReview =
    result.outcome !== "classified" || flags.some((flag) => REVIEW_FLAGS.has(flag));
  return needsReview ? "needs_review" : "ai_suggested";
}
