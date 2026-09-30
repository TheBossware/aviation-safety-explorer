import type { IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import type { IsitClassification, IsitCodeAssignment, IsitFinal, IsitOutcome, IsitReviewEvent } from "./types";
import { ISIT_OUTCOME_VALUES } from "./types";

export interface ReviewSubmission {
  actor: string;
  outcome: string;
  /**
   * Every code the reviewer wants. Codes of the current proposal (final if approved, else the AI
   * suggestion) keep their evidence; others are validated and added. The dimension comes from the code.
   */
  codes: string[];
  note: string | null;
}

export type ReviewEventDraft = Omit<IsitReviewEvent, "_id" | "news_id" | "at">;

export type ReviewResult = { ok: true; final: IsitFinal; events: ReviewEventDraft[] } | { ok: false; error: string };

/** Remembers the reviewer name between reviews. Not authentication: anyone can type any name. */
export const REVIEWER_COOKIE = "isit_reviewer";

/** What the reviewer starts from: their earlier decision if there is one, otherwise the AI suggestion. */
export function currentProposal(record: Pick<IsitClassification, "ai" | "final">): {
  outcome: IsitOutcome | null;
  codes: IsitCodeAssignment[];
} {
  if (record.final) return { outcome: record.final.outcome, codes: record.final.codes };
  if (record.ai) return { outcome: record.ai.outcome, codes: record.ai.codes };
  return { outcome: null, codes: [] };
}

/**
 * Turns a review form into the human-approved `final` plus one history event per change.
 * Added codes are validated against the taxonomy exactly like AI codes; only the evidence is optional.
 */
export function buildReview(
  record: Pick<IsitClassification, "news_id" | "ai" | "final">,
  submission: ReviewSubmission,
  taxonomy: IsitTaxonomy,
  now: Date = new Date()
): ReviewResult {
  const actor = submission.actor.trim();
  if (!actor) return { ok: false, error: "Enter your name as reviewer." };
  if (!(ISIT_OUTCOME_VALUES as readonly string[]).includes(submission.outcome)) {
    return { ok: false, error: "Choose an outcome." };
  }
  const outcome = submission.outcome as IsitOutcome;
  const proposal = currentProposal(record);

  let codes: IsitCodeAssignment[] = [];
  if (outcome === "classified") {
    const wanted = [...new Set(submission.codes.map((code) => code.trim()).filter(Boolean))];
    codes = proposal.codes.filter((code) => wanted.includes(code.code));
    for (const code of wanted) {
      if (codes.some((existing) => existing.code === code)) continue;
      const validation = taxonomy.validateCode(code);
      if (!validation.ok) return { ok: false, error: `Cannot add ${code}: ${validation.message}` };
      codes.push({
        code,
        dimension: validation.entry.dimension,
        label: validation.entry.label,
        evidence_quote: null,
        rationale: null,
      });
    }
    if (!codes.some((code) => code.dimension === "event")) {
      return { ok: false, error: "A classified record needs at least one event code." };
    }
  }

  const note = submission.note?.trim() || null;
  const final: IsitFinal = {
    outcome,
    codes,
    taxonomy_version: taxonomy.version,
    approved_by: actor,
    approved_at: now,
    note,
  };

  const suggestionId = record.ai?.suggestion_id ?? null;
  const event = (action: ReviewEventDraft["action"], before: unknown, after: unknown): ReviewEventDraft => ({
    action,
    actor,
    before,
    after,
    comment: null,
    suggestion_id: suggestionId,
  });

  const events: ReviewEventDraft[] = [];
  if (proposal.outcome !== outcome) events.push(event("set_outcome", proposal.outcome, outcome));
  const kept = new Set(codes.map((code) => code.code));
  const before = new Set(proposal.codes.map((code) => code.code));
  for (const code of proposal.codes) if (!kept.has(code.code)) events.push(event("reject_code", code, null));
  for (const code of codes) if (!before.has(code.code)) events.push(event("add_code", null, code));
  events.push({ ...event("approve", record.final ?? null, final), comment: note });

  return { ok: true, final, events };
}
