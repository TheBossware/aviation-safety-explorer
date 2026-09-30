/** Select options shared by the filter toolbar and the filter form. `ALL` means "no filter". */

import { ALL, DATE_RANGES } from "@/lib/aviation-news/filters";
import type { AirlineCount } from "@/lib/aviation-news/types";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";
import type { Source } from "@/lib/sources/types";

/** What the list can be filtered by, loaded by the page and passed to every filter component. */
export interface FilterChoices {
  categories: string[];
  sources: Source[];
  /** Airlines named in the news, with item counts. */
  airlines: AirlineCount[];
}

export interface FilterOption {
  value: string;
  /** Text in the open menu. */
  label: string;
  /** Text on the closed Select when this option is chosen, if shorter than `label`. */
  selectedLabel?: string;
}

export function categoryOptions(categories: string[]): FilterOption[] {
  return [{ value: ALL, label: "All Categories" }, ...categories.map((category) => ({ value: category, label: category }))];
}

export function severityOptions(): FilterOption[] {
  return [
    { value: ALL, label: "All Severities" },
    ...SEVERITY_VALUES.map((severity) => ({ value: severity, label: SEVERITY_LABELS[severity] })),
  ];
}

export function sourceOptions(sources: Source[]): FilterOption[] {
  return [{ value: ALL, label: "All Sources" }, ...sources.map((source) => ({ value: source.id, label: source.name }))];
}

export function airlineOptions(airlines: AirlineCount[]): FilterOption[] {
  return [
    { value: ALL, label: "All Airlines" },
    ...airlines.map((airline) => ({
      value: airline.name,
      label: `${airline.name} (${airline.count})`,
      selectedLabel: airline.name,
    })),
  ];
}

/** Includes `ALL` ("All time"). */
export const DATE_RANGE_OPTIONS: readonly FilterOption[] = DATE_RANGES;

export const SORT_OPTIONS: readonly FilterOption[] = [
  { value: "desc", label: "Newest first" },
  { value: "asc", label: "Oldest first" },
];

/**
 * Formatter for `<SelectValue>`: without one, base-ui renders the raw value ("All", "30d",
 * "MEDIUM"). Unfiltered selects show what they filter (e.g. "Severities"); filtered ones show
 * the chosen option's label, or the raw value if it is not an option (e.g. an old URL).
 */
export function selectLabel(unfiltered: string, options: readonly FilterOption[]) {
  const labels: Record<string, string> = Object.fromEntries(
    options.map((option) => [option.value, option.selectedLabel ?? option.label])
  );
  return (value: string | null) => (!value || value === ALL ? unfiltered : (labels[value] ?? value));
}
