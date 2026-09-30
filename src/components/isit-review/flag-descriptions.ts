/**
 * What each ISIT record flag means, for reviewers. Covers every flag the pipeline sets
 * (PREPROCESS_FLAGS, AI_FLAGS and INPUT_CHANGED_FLAG); keep in sync when adding one.
 */
export const FLAG_DESCRIPTIONS = {
  retraction_candidate: "The title withdraws or corrects an earlier post. The article may still tell the withdrawn story.",
  title_references_other_post: "The title links to another AvHerald article.",
  non_occurrence_candidate: "The title prefix says this is not an occurrence (\"News:\").",
  late_report: "Posted more than 30 days after the occurrence: usually an update or final report, not a new event.",
  date_anomaly: "Dates contradict each other, e.g. the occurrence date is after the post date.",
  missing_event_date: "The title looks like an occurrence, but no occurrence date could be read from it.",
  missing_content: "No usable article text; only the title can serve as evidence.",
  revocation: "The post withdraws an earlier one (AI gate or title wording).",
  correction: "The post corrects an earlier one.",
  title_content_conflict: "The AI found that the article does not describe what the title reports.",
  gate_conflict: "The automatic checks and the AI disagree about what kind of post this is.",
  code_dropped: "The AI returned a code or branch that failed validation; it was removed.",
  low_confidence: "The AI marked at least one kept code as uncertain.",
  ai_error: "The AI call failed; the record has no usable suggestion.",
  input_changed: "The news text changed after the last AI run or approval.",
} as const;

export type IsitFlag = keyof typeof FLAG_DESCRIPTIONS;

export function describeFlag(flag: string): string | undefined {
  return (FLAG_DESCRIPTIONS as Record<string, string>)[flag];
}
