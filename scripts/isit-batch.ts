/**
 * AI classification of preprocessed ISIT records.
 *
 *   npm run isit:batch                            dry run: lists what would be sent, no API calls
 *   npm run isit:batch -- --write --limit 20      classifies up to 20 records and stores the results
 *   npm run isit:batch -- --write --ids a,b,c     only these aviation_news ids
 *   npm run isit:batch -- --write --fetched-before 2026-09-29T00:00:00+03:00
 *                                                 only news ingested before that moment
 *
 * Skips approved records, records already classified with the same input + taxonomy + model +
 * prompt version, and records that failed MAX_ATTEMPTS times (those go to review instead).
 * n8n runs the same job (seed + preprocess + classify) through POST /api/isit/run.
 */
import mongoose from "mongoose";

import { MAX_ATTEMPTS, planClassify, runClassify } from "@/lib/isit-classification/jobs";
import { PIPELINE_VERSION } from "@/lib/isit-classification/pipeline";

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const write = process.argv.includes("--write");
  const limit = Number(argValue("--limit") ?? Infinity);
  const ids = argValue("--ids")?.split(",").map((id) => id.trim()).filter(Boolean);
  const fetchedBeforeArg = argValue("--fetched-before");
  const fetchedBefore = fetchedBeforeArg ? new Date(fetchedBeforeArg) : null;
  if (fetchedBefore && Number.isNaN(fetchedBefore.getTime())) throw new Error(`Invalid --fetched-before: ${fetchedBeforeArg}`);

  const plan = await planClassify({ limit, ids, fetchedBefore });
  const { key, batch } = plan;

  if (plan.unprocessed) {
    console.log(`${plan.unprocessed} record(s) not preprocessed yet; run npm run isit:preprocess -- --write first`);
  }
  console.log(`model ${key.model}, taxonomy ${key.taxonomy_version}, prompt ${key.prompt_version}, pipeline ${PIPELINE_VERSION}`);
  console.log(
    `candidates: ${plan.candidates}, up to date: ${plan.upToDate}, input changed (re-run preprocess): ${plan.outdatedInput}, ` +
      (fetchedBefore ? `fetched on/after ${fetchedBefore.toISOString()}: ${plan.fetchedTooLate}, ` : "") +
      `retries exhausted: ${plan.exhausted.length}, queued: ${plan.queued}, this run: ${batch.length}`
  );

  if (!write) {
    for (const { news } of batch) console.log(`  would classify ${news._id} ${news.title.slice(0, 100)}`);
    console.log("\ndry run: no API calls made; re-run with --write");
    return;
  }

  const summary = await runClassify(plan, {
    onRecord: ({ news, result, workflowStatus, applied }) => {
      const label = `${result.outcome ?? "FAILED"} / ${workflowStatus}`;
      const codes = result.codes.map((c) => `${c.dimension[0]}:${c.code} ${c.label.split(" > ").at(-1)}`).join("; ");
      console.log(
        `\n${news._id} ${news.title.slice(0, 90)}\n  -> ${label}${result.flags.length ? ` [${result.flags.join(", ")}]` : ""}` +
          `${codes ? `\n     ${codes}` : ""}${result.error ? `\n     error: ${result.error}` : ""}` +
          `${applied ? "" : "\n     (not applied: record changed meanwhile)"}`
      );
    },
  });
  if (summary.movedToReview) console.log(`${summary.movedToReview} record(s) failed ${MAX_ATTEMPTS} times -> needs_review`);

  if (summary.fatalError) {
    console.log(`
STOPPED: ${summary.fatalError}
${summary.untouched} record(s) left untouched (no attempt recorded); fix the account and re-run.`);
    process.exitCode = 2;
  }

  const { usage, estimatedCostUsd: cost } = summary;
  console.log("\nresults:", summary.tally);
  console.log(
    `tokens: in ${usage.input_tokens}, out ${usage.output_tokens}, cache read ${usage.cache_read_input_tokens}, ` +
      `cache write ${usage.cache_creation_input_tokens}; est. cost $${cost.toFixed(2)}` +
      (summary.classified ? ` ($${(cost / summary.classified).toFixed(3)}/record)` : "")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
