/**
 * AI classification of preprocessed ISIT records.
 *
 *   npm run isit:batch                            dry run: lists what would be sent, no API calls
 *   npm run isit:batch -- --write --limit 20      classifies up to 20 records and stores the results
 *   npm run isit:batch -- --write --ids a,b,c     only these aviation_news ids
 *
 * Skips approved records, records already classified with the same input + taxonomy + model +
 * prompt version, and records that failed MAX_ATTEMPTS times (those go to review instead).
 */
import mongoose from "mongoose";

import { findAllBySource } from "@/lib/aviation-news/repository";
import type { AviationNews } from "@/lib/aviation-news/types";
import { createAnthropicClient, ISIT_MODEL, type StageUsage } from "@/lib/isit-classification/llm/client";
import { PROMPT_VERSION } from "@/lib/isit-classification/llm/prompts";
import { classify, mergeFlags, nextWorkflowStatus, PIPELINE_VERSION } from "@/lib/isit-classification/pipeline";
import { preprocess } from "@/lib/isit-classification/preprocess";
import {
  findAllClassifications,
  findRunHistory,
  markForReview,
  saveRun,
} from "@/lib/isit-classification/repository";
import { ISIT_SOURCE_ID, type IsitClassification } from "@/lib/isit-classification/types";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";

const MAX_ATTEMPTS = 3;
const CONCURRENCY = 3;
/** USD per million tokens for claude-opus-5-5 (input, output, cache read, cache write). */
const PRICE = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function cost(usage: StageUsage): number {
  return (
    (usage.input_tokens * PRICE.input +
      usage.output_tokens * PRICE.output +
      usage.cache_read_input_tokens * PRICE.cacheRead +
      usage.cache_creation_input_tokens * PRICE.cacheWrite) /
    1_000_000
  );
}

async function main() {
  const write = process.argv.includes("--write");
  const limit = Number(argValue("--limit") ?? Infinity);
  const ids = argValue("--ids")?.split(",").map((id) => id.trim()).filter(Boolean);

  const taxonomy = loadIsitTaxonomy();
  const key = { taxonomy_version: taxonomy.version, model: ISIT_MODEL, prompt_version: PROMPT_VERSION };

  const newsById = new Map((await findAllBySource(ISIT_SOURCE_ID)).map((item) => [String(item._id), item]));
  let records = (await findAllClassifications()).filter((r) => r.workflow_status !== "approved");
  if (ids) records = records.filter((r) => ids.includes(String(r.news_id)));

  const unprocessed = records.filter((r) => !r.input.fingerprint);
  if (unprocessed.length) {
    console.log(`${unprocessed.length} record(s) not preprocessed yet; run npm run isit:preprocess -- --write first`);
  }

  const history = await findRunHistory(
    records.filter((r) => r.input.fingerprint).map((r) => ({ newsId: String(r.news_id), fingerprint: r.input.fingerprint! })),
    key
  );

  const queue: Array<{ record: IsitClassification; news: AviationNews }> = [];
  const exhausted: IsitClassification[] = [];
  let upToDate = 0;
  let outdatedInput = 0;
  for (const record of records) {
    const id = String(record.news_id);
    const news = newsById.get(id);
    const past = history.get(id);
    if (!record.input.fingerprint || !news || !past) continue;
    if (preprocess(news).fingerprint !== record.input.fingerprint) {
      outdatedInput++; // aviation_news changed since preprocessing
      continue;
    }
    if (past.succeeded) {
      upToDate++;
      continue;
    }
    if (past.failedAttempts >= MAX_ATTEMPTS) {
      exhausted.push(record);
      continue;
    }
    queue.push({ record, news });
  }
  const batch = queue.slice(0, limit);

  console.log(`model ${key.model}, taxonomy ${key.taxonomy_version}, prompt ${key.prompt_version}, pipeline ${PIPELINE_VERSION}`);
  console.log(
    `candidates: ${records.length}, up to date: ${upToDate}, input changed (re-run preprocess): ${outdatedInput}, ` +
      `retries exhausted: ${exhausted.length}, queued: ${queue.length}, this run: ${batch.length}`
  );

  if (!write) {
    for (const { news } of batch) console.log(`  would classify ${news._id} ${news.title.slice(0, 100)}`);
    console.log("\ndry run: no API calls made; re-run with --write");
    return;
  }

  for (const record of exhausted) {
    if (record.workflow_status !== "needs_review") {
      await markForReview(String(record.news_id), mergeFlags(record.flags, ["ai_error"]));
      console.log(`  ${record.news_id} failed ${MAX_ATTEMPTS} times -> needs_review`);
    }
  }

  const client = createAnthropicClient();
  const total: StageUsage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
  const tally: Record<string, number> = {};
  let next = 0;

  async function worker() {
    while (next < batch.length) {
      const { record, news } = batch[next++];
      const id = String(record.news_id);
      const pre = preprocess(news);
      const result = await classify(news, pre, taxonomy, client);
      const flags = mergeFlags(record.flags, result.flags);
      const workflowStatus = nextWorkflowStatus(record.workflow_status, result, flags);

      const saved = await saveRun({
        newsId: id,
        expectedFingerprint: record.input.fingerprint!,
        flags,
        workflowStatus,
        suggestion: {
          status: result.status,
          input_fingerprint: record.input.fingerprint!,
          ...key,
          pipeline_version: PIPELINE_VERSION,
          outcome: result.outcome,
          codes: result.codes,
          flags: result.flags,
          stages: { ...result.stages, served_models: result.servedModels },
          error: result.error,
          usage: { input_tokens: result.usage.input_tokens, output_tokens: result.usage.output_tokens },
        },
      });

      for (const field of Object.keys(total) as Array<keyof StageUsage>) total[field] += result.usage[field];
      const label = `${result.outcome ?? "FAILED"} / ${workflowStatus}`;
      tally[label] = (tally[label] ?? 0) + 1;
      const codes = result.codes.map((c) => `${c.dimension[0]}:${c.code} ${c.label.split(" > ").at(-1)}`).join("; ");
      console.log(
        `\n${id} ${news.title.slice(0, 90)}\n  -> ${label}${result.flags.length ? ` [${result.flags.join(", ")}]` : ""}` +
          `${codes ? `\n     ${codes}` : ""}${result.error ? `\n     error: ${result.error}` : ""}` +
          `${saved.applied ? "" : "\n     (not applied: record changed meanwhile)"}`
      );
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));

  console.log("\nresults:", tally);
  console.log(
    `tokens: in ${total.input_tokens}, out ${total.output_tokens}, cache read ${total.cache_read_input_tokens}, ` +
      `cache write ${total.cache_creation_input_tokens}; est. cost $${cost(total).toFixed(2)}` +
      (batch.length ? ` ($${(cost(total) / batch.length).toFixed(3)}/record)` : "")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
