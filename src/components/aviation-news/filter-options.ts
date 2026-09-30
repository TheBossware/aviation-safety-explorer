/** Select options shared by the filter toolbar and the filter form. `ALL` means "no filter". */

import { ALL, DATE_RANGES } from "@/lib/aviation-news/filters";

export const SORT_OPTIONS = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

/**
 * Formatter for `<SelectValue>`: without one, base-ui renders the raw value ("All", "30d",
 * "MEDIUM"). Unfiltered selects show what they filter (e.g. "Severities"); filtered ones show
 * the chosen option's label.
 */
export function selectLabel(unfiltered: string, labels: Record<string, string> = {}) {
  return (value: string | null) => (!value || value === ALL ? unfiltered : (labels[value] ?? value));
}

export const DATE_RANGE_LABELS = Object.fromEntries(DATE_RANGES.map((r) => [r.value, r.label]));
export const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.label]));
