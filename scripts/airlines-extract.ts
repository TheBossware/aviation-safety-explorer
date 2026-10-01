/**
 * Extracts airlines for news items that have none yet.
 *
 *   npm run airlines:extract                       dry run: calls the model, prints the result, writes nothing
 *   npm run airlines:extract -- --write            stores the result in aviation_news
 *   npm run airlines:extract -- --limit=10         at most 10 items (default 50)
 */
import { runScript } from "./run-script";

import { planAirlines, runAirlines } from "@/lib/airline-extraction/jobs";

async function main() {
  const write = process.argv.includes("--write");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;
  if (limit !== undefined && !(Number.isInteger(limit) && limit > 0)) throw new Error(`--limit must be a positive integer, got ${limitArg}`);

  const plan = await planAirlines({ limit });
  console.log(`items without airlines: ${plan.queued}, this run: ${plan.batch.length}, known airline names: ${plan.knownNames.length}`);
  if (plan.batch.length === 0) return;

  const summary = await runAirlines(plan, {
    write,
    onItem: ({ news, extraction, saved }) => {
      const roles = extraction.roles.map((r) => `${r.name} (${r.role})`).join(", ") || "none";
      console.log(`${saved ? "saved " : write ? "skipped" : "dry    "} ${news._id} ${news.title.slice(0, 80)}\n        -> ${roles}`);
    },
  });

  console.log(
    `\nextracted: ${summary.extracted}, saved: ${summary.saved}, failed: ${summary.failed}, untouched: ${summary.untouched}, ` +
      `cost ≈ $${summary.estimatedCostUsd.toFixed(3)}`
  );
  if (summary.fatalError) console.log(`stopped: ${summary.fatalError}`);
  if (!write) console.log("dry run: nothing written; re-run with --write to store");
}

runScript(main);
