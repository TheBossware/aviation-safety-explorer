import type { GateOutput, RouteOutput, SelectOutput } from "./llm/schemas";
import type { IsitSuggestion } from "./types";
import type { Rejection } from "./validate";

/**
 * What `classify()` (pipeline.ts) and `isit:revalidate` store in `IsitSuggestion.stages`. Every
 * stage is optional: a run stops after the gate for revoked / not applicable records, and a failed
 * run keeps whatever stages finished before the error.
 */
export interface StoredStages {
  gate?: GateOutput;
  route?: { output: RouteOutput; rejected: Rejection[] };
  select?: { output: SelectOutput; rejected: Rejection[]; lowConfidence: string[] };
}

/**
 * Typed view of a suggestion's stored stage outputs. `stages` is a schemaless Mixed field, so this
 * is the one place its shape is asserted; `{}` when there is no suggestion.
 */
export function readStages(suggestion: Pick<IsitSuggestion, "stages"> | null | undefined): StoredStages {
  return (suggestion?.stages ?? {}) as StoredStages;
}
