import type { IsitCodeAssignment, IsitReviewEvent } from "./types";

/**
 * `before`/`after` of a review event are schemaless (Mixed): a code assignment for code events, an
 * outcome string for `set_outcome`, the whole `final` for `approve`. Checked, not cast, before use.
 */
function isCodeAssignment(value: unknown): value is IsitCodeAssignment {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { code?: unknown }).code === "string" &&
    typeof (value as { label?: unknown }).label === "string"
  );
}

function describeCode(value: unknown): string {
  return isCodeAssignment(value) ? `${value.code} ${value.label}` : "";
}

/** One line of the review history, e.g. "added 40090200 Diversion". */
export function describeReviewEvent(event: Pick<IsitReviewEvent, "action" | "before" | "after">): string {
  switch (event.action) {
    case "set_outcome":
      return `outcome ${event.before ?? "none"} → ${event.after}`;
    case "reject_code":
      return `removed ${describeCode(event.before)}`;
    case "add_code":
      return `added ${describeCode(event.after)}`;
    case "approve":
      return event.before ? "updated the approved result" : "approved";
    default:
      return event.action;
  }
}
