import type { StageUsage } from "./client";

/**
 * USD per million tokens, Claude API first-party list prices. Cache writes are for the default
 * 5-minute TTL (1.25x input). Update here when prices change; stored suggestions keep raw tokens,
 * so costs can always be recomputed.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
};

/** Estimated USD cost of a usage record; null when the model has no known price. */
export function estimateCost(model: string, usage: Partial<StageUsage>): number | null {
  const price = MODEL_PRICES[model];
  if (!price) return null;
  return (
    ((usage.input_tokens ?? 0) * price.input +
      (usage.output_tokens ?? 0) * price.output +
      (usage.cache_read_input_tokens ?? 0) * price.cacheRead +
      (usage.cache_creation_input_tokens ?? 0) * price.cacheWrite) /
    1_000_000
  );
}
