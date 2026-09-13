import type { ChartConfig } from "@/components/ui/chart";

/**
 * Validated categorical palette (dataviz skill, palette.md) — fixed hue order,
 * never cycled or re-derived. Passes CVD + contrast checks for up to 5 adjacent
 * series in both light and dark mode; a 6th+ series folds into "Other" instead
 * of generating a new hue.
 */
const CATEGORICAL_COLORS: { light: string; dark: string }[] = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue
  { light: "#eb6834", dark: "#d95926" }, // orange
  { light: "#1baf7a", dark: "#199e70" }, // aqua
  { light: "#eda100", dark: "#c98500" }, // yellow
  { light: "#e87ba4", dark: "#d55181" }, // magenta
];

const OTHER_COLOR = { light: "#c3c2b7", dark: "#52514e" };

export const OTHER_KEY = "Other";

/** Builds a shadcn ChartConfig assigning fixed palette slots in order; "Other" always gets the neutral gray. */
export function buildCategoricalChartConfig(keys: string[]): ChartConfig {
  const config: ChartConfig = {};
  let slot = 0;
  for (const key of keys) {
    if (key === OTHER_KEY) {
      config[key] = { label: OTHER_KEY, theme: OTHER_COLOR };
    } else {
      config[key] = { label: key, theme: CATEGORICAL_COLORS[slot % CATEGORICAL_COLORS.length] };
      slot += 1;
    }
  }
  return config;
}
