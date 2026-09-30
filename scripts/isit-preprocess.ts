/**
 * Deterministic preprocessing of seeded ISIT records: fingerprint, dates, flags, relations.
 *
 *   npm run isit:preprocess            dry run: prints the report, writes nothing
 *   npm run isit:preprocess -- --write applies the changes (never touches `ai` or `final`)
 */
import { runScript } from "./run-script";

import { planPreprocessAll, preprocessAll } from "@/lib/isit-classification/jobs";
import { PREPROCESS_FLAGS } from "@/lib/isit-classification/preprocess";

/** Flags worth listing one by one in the report; the rest are only counted. */
const LISTED_FLAGS = new Set(["retraction_candidate", "non_occurrence_candidate", "date_anomaly", "missing_event_date", "missing_content"]);

async function main() {
  const write = process.argv.includes("--write");

  const plan = await planPreprocessAll();
  const { news, seeded, unseeded, results, relations, writes, inputChanged } = plan;

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
  const { written } = await preprocessAll(plan);
  console.log(`\nwritten: ${written}/${writes.length}${written < writes.length ? " (others changed concurrently; re-run)" : ""}`);
}

runScript(main);
