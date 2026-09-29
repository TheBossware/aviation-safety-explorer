/**
 * Deterministic preprocessing of seeded ISIT records: fingerprint, dates, flags, relations.
 *
 *   npm run isit:preprocess            dry run: prints the report, writes nothing
 *   npm run isit:preprocess -- --write applies the changes (never touches `ai` or `final`)
 */
import mongoose from "mongoose";

import { findAllBySource } from "@/lib/aviation-news/repository";
import { buildRelations, planPreprocessUpdate, PREPROCESS_FLAGS, preprocess } from "@/lib/isit-classification/preprocess";
import { applyPreprocess, findByNewsIds, type PreprocessWrite } from "@/lib/isit-classification/repository";
import { decideScope } from "@/lib/isit-classification/scope";
import { ISIT_SOURCE_ID } from "@/lib/isit-classification/types";

/** Flags worth listing one by one in the report; the rest are only counted. */
const LISTED_FLAGS = new Set(["retraction_candidate", "non_occurrence_candidate", "date_anomaly", "missing_event_date", "missing_content"]);

async function main() {
  const write = process.argv.includes("--write");

  const news = (await findAllBySource(ISIT_SOURCE_ID)).filter((item) => decideScope(item).inScope);
  const records = new Map((await findByNewsIds(news.map((item) => String(item._id)))).map((r) => [String(r.news_id), r]));
  const unseeded = news.filter((item) => !records.has(String(item._id)));
  const seeded = news.filter((item) => records.has(String(item._id)));

  const results = new Map(seeded.map((item) => [String(item._id), preprocess(item)]));
  const relations = buildRelations(
    seeded.map((item) => {
      const result = results.get(String(item._id))!;
      return {
        newsId: String(item._id),
        articleId: records.get(String(item._id))!.article_id,
        referencedArticleId: result.referencedArticleId,
        isRetraction: result.flags.includes("retraction_candidate"),
      };
    })
  );

  const writes: PreprocessWrite[] = [];
  let inputChanged = 0;
  for (const item of seeded) {
    const id = String(item._id);
    const record = records.get(id)!;
    const plan = planPreprocessUpdate(record, results.get(id)!, relations.get(id) ?? []);
    if (plan.inputChanged) inputChanged++;
    if (plan.changed) writes.push({ newsId: id, expectedFingerprint: record.input.fingerprint, set: plan.set });
  }

  console.log(`in-scope news: ${news.length}, seeded: ${seeded.length}, not seeded (run isit:seed): ${unseeded.length}`);
  console.log(`would change: ${writes.length}, input changed since last run: ${inputChanged}`);

  console.log("\nflags:");
  for (const flag of PREPROCESS_FLAGS) {
    const flagged = seeded.filter((item) => results.get(String(item._id))!.flags.includes(flag));
    console.log(`  ${flag}: ${flagged.length}`);
    if (LISTED_FLAGS.has(flag)) for (const item of flagged) console.log(`    ${item._id} ${item.title.slice(0, 110)}`);
  }

  const relationCounts: Record<string, number> = {};
  for (const list of relations.values()) for (const relation of list) relationCounts[relation.type] = (relationCounts[relation.type] ?? 0) + 1;
  console.log("\nrelations:", relationCounts);
  for (const [id, list] of relations) {
    for (const relation of list.filter((r) => r.type === "revokes")) {
      console.log(`  ${id} revokes article ${relation.article_id} (stored record: ${relation.news_id ?? "none"})`);
    }
  }

  const withEventDate = [...results.values()].filter((r) => r.eventDate).length;
  const withHeader = [...results.values()].filter((r) => r.articleCreatedAt && r.articleUpdatedAt).length;
  console.log(`\ndates: event date parsed ${withEventDate}/${seeded.length}, article created+updated parsed ${withHeader}/${seeded.length}`);

  if (!write) {
    console.log("\ndry run: nothing written; re-run with --write to apply");
    return;
  }
  const written = await applyPreprocess(writes);
  console.log(`\nwritten: ${written}/${writes.length}${written < writes.length ? " (others changed concurrently; re-run)" : ""}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
