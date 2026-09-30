/**
 * Re-applies the current validation rules to stored model output, without calling the model.
 * Use after a validation change (PIPELINE_VERSION bump). A changed result is stored as a new
 * suggestion linked to the old one (`stages.revalidated_from`); the old one stays as it was.
 *
 *   npm run isit:revalidate            dry run
 *   npm run isit:revalidate -- --write
 */
import { runScript } from "./run-script";

import { findAllBySource } from "@/lib/aviation-news/repository";
import { emptyUsage } from "@/lib/isit-classification/llm/client";
import { applySelection, mergeFlags, nextWorkflowStatus, PIPELINE_VERSION } from "@/lib/isit-classification/pipeline";
import { findAllClassifications, findSuggestionById, saveRun } from "@/lib/isit-classification/repository";
import { readStages } from "@/lib/isit-classification/stages";
import { ISIT_SOURCE_ID } from "@/lib/isit-classification/types";
import { validateRoute } from "@/lib/isit-classification/validate";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";

/** Flags that validation derives; everything else on a suggestion is kept as the model run left it. */
const VALIDATION_FLAGS = new Set(["code_dropped", "low_confidence"]);

async function main() {
  const write = process.argv.includes("--write");
  const taxonomy = loadIsitTaxonomy();
  const newsById = new Map((await findAllBySource(ISIT_SOURCE_ID)).map((item) => [item._id, item]));

  let checked = 0;
  let unchanged = 0;
  let changed = 0;
  let skipped = 0;

  for (const record of await findAllClassifications()) {
    if (!record.ai) continue;
    const suggestion = await findSuggestionById(record.ai.suggestion_id);
    const stages = readStages(suggestion);
    const news = newsById.get(record.news_id);
    if (!suggestion || !stages.route || !stages.select || !news) continue; // no code selection to re-check
    if (suggestion.pipeline_version === PIPELINE_VERSION) continue;
    if (suggestion.input_fingerprint !== record.input.fingerprint) {
      skipped++; // the input changed since: needs a real model run, not a re-validation
      continue;
    }
    checked++;

    const routed = validateRoute(stages.route.output, taxonomy);
    const selected = applySelection(stages.select.output, routed.branches, taxonomy, [news.title ?? "", news.content ?? ""]);
    const aiFlags = [
      ...new Set([
        ...suggestion.flags.filter((flag) => !VALIDATION_FLAGS.has(flag)),
        ...(routed.rejected.length ? ["code_dropped"] : []),
        ...selected.flags,
      ]),
    ];

    const sameCodes = JSON.stringify(selected.codes.map((c) => c.code)) === JSON.stringify(suggestion.codes.map((c) => c.code));
    if (sameCodes && selected.outcome === suggestion.outcome && JSON.stringify(aiFlags) === JSON.stringify(suggestion.flags)) {
      unchanged++;
      continue;
    }
    changed++;

    const added = selected.codes.filter((c) => !suggestion.codes.some((old) => old.code === c.code));
    console.log(
      `${record.news_id} ${news.title.slice(0, 80)}\n  ${suggestion.outcome} -> ${selected.outcome}; ` +
        `flags [${suggestion.flags.join(", ")}] -> [${aiFlags.join(", ")}]` +
        (added.length ? `\n  recovered: ${added.map((c) => `${c.dimension[0]}:${c.code} ${c.label.split(" > ").at(-1)}`).join("; ")}` : "")
    );
    if (!write) continue;

    const result = { status: "succeeded", outcome: selected.outcome } as const;
    const flags = mergeFlags(record.flags, aiFlags);
    await saveRun({
      newsId: record.news_id,
      expectedFingerprint: record.input.fingerprint!,
      flags,
      workflowStatus: nextWorkflowStatus(record.workflow_status, result, flags),
      suggestion: {
        status: "succeeded",
        input_fingerprint: suggestion.input_fingerprint,
        taxonomy_version: suggestion.taxonomy_version,
        model: suggestion.model,
        prompt_version: suggestion.prompt_version,
        pipeline_version: PIPELINE_VERSION,
        outcome: selected.outcome,
        codes: selected.codes,
        flags: aiFlags,
        stages: { ...suggestion.stages, select: selected.stage, revalidated_from: suggestion._id },
        error: null,
        usage: emptyUsage(),
      },
    });
  }

  console.log(`\nchecked ${checked}, unchanged ${unchanged}, changed ${changed}, skipped (input changed) ${skipped}`);
  if (!write && changed) console.log("dry run: nothing written; re-run with --write");
}

runScript(main);
