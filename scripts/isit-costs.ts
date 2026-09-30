/**
 * AI cost report from stored token usage, per UTC day.
 *
 *   npm run isit:costs
 *
 * Suggestions created before cache tokens were recorded (2026-09-29 ~09:30 UTC) lack their cache
 * reads; their cost is slightly underestimated (cache reads are 5% of the input price).
 */
import { runScript } from "./run-script";

import { estimateCost } from "@/lib/isit-classification/llm/pricing";
import { findSuggestionUsage } from "@/lib/isit-classification/repository";

interface Bucket {
  runs: number;
  failed: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  missingCache: number;
}

const empty = (): Bucket => ({ runs: 0, failed: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, missingCache: 0 });

async function main() {
  const rows = await findSuggestionUsage();
  const days = new Map<string, Bucket>();
  const total = empty();

  for (const row of rows) {
    const day = new Date(row.created_at ?? 0).toISOString().slice(0, 10);
    const usage = row.usage ?? { input_tokens: 0, output_tokens: 0 };
    const cost = estimateCost(row.model, usage) ?? 0;
    for (const bucket of [days.get(day) ?? days.set(day, empty()).get(day)!, total]) {
      bucket.runs++;
      if (row.status === "failed") bucket.failed++;
      bucket.input += usage.input_tokens ?? 0;
      bucket.output += usage.output_tokens ?? 0;
      bucket.cacheRead += usage.cache_read_input_tokens ?? 0;
      bucket.cacheWrite += usage.cache_creation_input_tokens ?? 0;
      bucket.cost += cost;
      if (usage.cache_read_input_tokens === undefined && usage.input_tokens) bucket.missingCache++;
    }
  }

  const line = (label: string, b: Bucket) => {
    const cacheShare = b.input + b.cacheRead ? (100 * b.cacheRead) / (b.input + b.cacheRead) : 0;
    console.log(
      `${label.padEnd(10)} runs ${String(b.runs).padStart(4)} (failed ${b.failed})  ` +
        `in ${b.input.toLocaleString("en-US").padStart(10)}  out ${b.output.toLocaleString("en-US").padStart(8)}  ` +
        `cache read ${b.cacheRead.toLocaleString("en-US").padStart(9)} (${cacheShare.toFixed(0)}% of input)  ` +
        `$${b.cost.toFixed(2)}` +
        (b.missingCache ? `  [${b.missingCache} run(s) without cache data]` : "")
    );
  };

  for (const [day, bucket] of days) line(day, bucket);
  line("TOTAL", total);
  const succeeded = total.runs - total.failed;
  if (succeeded) console.log(`average per successful run: $${(total.cost / succeeded).toFixed(3)}`);
}

runScript(main);
