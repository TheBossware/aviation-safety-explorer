/** Select options shared by the filter toolbar and the filter form. "All" means "no filter". */

export const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 1 year" },
  { value: "All", label: "All time" },
];

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
  return (value: string | null) => (!value || value === "All" ? unfiltered : (labels[value] ?? value));
}

export const DATE_RANGE_LABELS = Object.fromEntries(DATE_RANGES.map((r) => [r.value, r.label]));
export const SORT_LABELS = Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.label]));
