/**
 * Creates a `pending` ISIT classification record for every in-scope AvHerald news item.
 *
 *   npm run isit:seed            dry run: reports what would happen, writes nothing
 *   npm run isit:seed -- --write creates the ISIT collections/indexes and inserts missing records
 *
 * Existing records are never modified, so it is safe to re-run after each n8n ingest.
 */
import mongoose from "mongoose";

import { findAllBySource } from "@/lib/aviation-news/repository";
import { ensureIndexes, ensurePending, findExistingNewsIds } from "@/lib/isit-classification/repository";
import { decideScope } from "@/lib/isit-classification/scope";
import { ISIT_SOURCE_ID } from "@/lib/isit-classification/types";

async function main() {
  const write = process.argv.includes("--write");

  const news = await findAllBySource(ISIT_SOURCE_ID);
  const inScope = [];
  const skipped: string[] = [];
  for (const item of news) {
    const scope = decideScope(item);
    if (scope.inScope) inScope.push(item);
    else skipped.push(`${item._id}: ${scope.reason}`);
  }

  console.log(`${ISIT_SOURCE_ID} news: ${news.length}, in scope: ${inScope.length}, skipped: ${skipped.length}`);
  for (const line of skipped) console.log(`  skipped ${line}`);

  if (!write) {
    const existing = await findExistingNewsIds(inScope.map((item) => String(item._id)));
    console.log(`dry run: would insert ${inScope.length - existing.size}, already present ${existing.size}`);
    console.log("re-run with --write to apply");
    return;
  }

  await ensureIndexes();
  const result = await ensurePending(inScope);
  console.log(`inserted ${result.inserted}, already present ${result.existing}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
