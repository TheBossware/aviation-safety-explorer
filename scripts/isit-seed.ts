/**
 * Creates a `pending` ISIT classification record for every in-scope AvHerald news item.
 *
 *   npm run isit:seed            dry run: reports what would happen, writes nothing
 *   npm run isit:seed -- --write creates the ISIT collections/indexes and inserts missing records
 *
 * Existing records are never modified, so it is safe to re-run after each n8n ingest.
 */
import { runScript } from "./run-script";

import { planSeed, seedPending } from "@/lib/isit-classification/jobs";
import { findExistingNewsIds } from "@/lib/isit-classification/repository";
import { ISIT_SOURCE_ID } from "@/lib/isit-classification/types";

async function main() {
  const write = process.argv.includes("--write");

  const plan = await planSeed();
  const { news, inScope, skipped } = plan;

  console.log(`${ISIT_SOURCE_ID} news: ${news.length}, in scope: ${inScope.length}, skipped: ${skipped.length}`);
  for (const { id, reason } of skipped) console.log(`  skipped ${id}: ${reason}`);

  if (!write) {
    const existing = await findExistingNewsIds(inScope.map((item) => item._id));
    console.log(`dry run: would insert ${inScope.length - existing.size}, already present ${existing.size}`);
    console.log("re-run with --write to apply");
    return;
  }

  const result = await seedPending(plan);
  console.log(`inserted ${result.inserted}, already present ${result.existing}`);
}

runScript(main);
