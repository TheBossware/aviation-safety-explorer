import { z } from "zod";

/** Structured outputs for the three model stages. The API enforces the shape; content is re-validated in code. */

export const GateSchema = z.object({
  post_type: z.enum(["occurrence_report", "update", "correction", "revocation", "non_occurrence", "other"]),
  decision: z.enum(["proceed", "revoked", "not_applicable", "insufficient_evidence"]),
  /** Whether the linked article describes the same occurrence the title reports. */
  title_content_consistent: z.boolean(),
  evidence_quote: z.string(),
  rationale: z.string(),
});
export type GateOutput = z.infer<typeof GateSchema>;

const RoutedBranch = z.object({
  branch_code: z.string(),
  evidence_quote: z.string(),
});

export const RouteSchema = z.object({
  event: z.array(RoutedBranch),
  context: z.array(RoutedBranch),
  contributing: z.array(RoutedBranch),
});
export type RouteOutput = z.infer<typeof RouteSchema>;

export const SelectSchema = z.object({
  codes: z.array(
    z.object({
      code: z.string(),
      dimension: z.enum(["event", "context", "contributing"]),
      evidence_quote: z.string(),
      rationale: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    })
  ),
});
export type SelectOutput = z.infer<typeof SelectSchema>;
