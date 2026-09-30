/**
 * The ISIT jobs (seed → preprocess → classify) as plain functions, shared by the CLI scripts in
 * `scripts/` and the `/api/isit/run` route that n8n calls after each ingest.
 */
import { findAllBySource } from "@/lib/aviation-news/repository";
import type { AviationNews } from "@/lib/aviation-news/types";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { decideClassify, toSuggestion } from "./classify-run";
import {
  addUsage,
  createAnthropicClient,
  emptyUsage,
  FatalClientError,
  ISIT_MODEL,
  type StageUsage,
} from "./llm/client";
import { estimateCost } from "./llm/pricing";
import { PROMPT_VERSION } from "./llm/prompts";
import { classify, mergeFlags, nextWorkflowStatus, type ClassifyResult } from "./pipeline";
import { buildRelations, planPreprocessUpdate, preprocess, type PreprocessResult } from "./preprocess";
import {
  applyPreprocess,
  ensureIndexes,
  ensurePending,
  findAllClassifications,
  findByNewsIds,
  findRunHistory,
  markForReview,
  saveRun,
  type EnsurePendingResult,
  type PreprocessWrite,
} from "./repository";
import { ISIT_SOURCE_ID, type IsitClassification, type IsitRelation, type IsitWorkflowStatus } from "./types";

/** Model calls in flight at once. */
const CONCURRENCY = 3;

// --- seed -------------------------------------------------------------------------------------

export interface SeedPlan {
  news: AviationNews[];
}

export async function planSeed(): Promise<SeedPlan> {
  return { news: await findAllBySource(ISIT_SOURCE_ID) };
}

/** Creates a `pending` record for every AvHerald news item; existing records are never modified. */
export async function seedPending(plan?: SeedPlan): Promise<EnsurePendingResult> {
  const { news } = plan ?? (await planSeed());
  await ensureIndexes();
  return ensurePending(news);
}

// --- preprocess -------------------------------------------------------------------------------

export interface PreprocessAllPlan {
  news: AviationNews[];
  seeded: AviationNews[];
  unseeded: AviationNews[];
  results: Map<string, PreprocessResult>;
  relations: Map<string, IsitRelation[]>;
  writes: PreprocessWrite[];
  inputChanged: number;
}

export async function planPreprocessAll(): Promise<PreprocessAllPlan> {
  const news = await findAllBySource(ISIT_SOURCE_ID);
  const records = new Map((await findByNewsIds(news.map((item) => item._id))).map((r) => [r.news_id, r]));
  const unseeded = news.filter((item) => !records.has(item._id));
  const seeded = news.filter((item) => records.has(item._id));

  const results = new Map(seeded.map((item) => [item._id, preprocess(item)]));
  const relations = buildRelations(
    seeded.map((item) => {
      const result = results.get(item._id)!;
      return {
        newsId: item._id,
        articleId: records.get(item._id)!.article_id,
        referencedArticleId: result.referencedArticleId,
        isRetraction: result.flags.includes("retraction_candidate"),
      };
    })
  );

  const writes: PreprocessWrite[] = [];
  let inputChanged = 0;
  for (const item of seeded) {
    const id = item._id;
    const record = records.get(id)!;
    const plan = planPreprocessUpdate(record, results.get(id)!, relations.get(id) ?? []);
    if (plan.inputChanged) inputChanged++;
    if (plan.changed) writes.push({ newsId: id, expectedFingerprint: record.input.fingerprint, set: plan.set });
  }
  return { news, seeded, unseeded, results, relations, writes, inputChanged };
}

export interface PreprocessAllSummary {
  planned: number;
  written: number;
  inputChanged: number;
}

/** Applies the deterministic preprocessing (never touches `ai` or `final`). */
export async function preprocessAll(plan?: PreprocessAllPlan): Promise<PreprocessAllSummary> {
  const { writes, inputChanged } = plan ?? (await planPreprocessAll());
  const written = await applyPreprocess(writes);
  return { planned: writes.length, written, inputChanged };
}

// --- classify ---------------------------------------------------------------------------------

export interface ClassifyOptions {
  limit?: number;
  /** Only these aviation_news ids. */
  ids?: string[];
  /** Only news ingested before this moment. */
  fetchedBefore?: Date | null;
}

export interface ClassifyPlan {
  key: { taxonomy_version: string; model: string; prompt_version: string };
  candidates: number;
  unprocessed: number;
  upToDate: number;
  outdatedInput: number;
  fetchedTooLate: number;
  exhausted: IsitClassification[];
  queued: number;
  batch: Array<{ record: IsitClassification; news: AviationNews }>;
}

/**
 * Picks what to classify. Skips approved records, records already classified with the same input +
 * taxonomy + model + prompt version, and records that failed MAX_ATTEMPTS times.
 */
export async function planClassify({ limit = Infinity, ids, fetchedBefore }: ClassifyOptions = {}): Promise<ClassifyPlan> {
  const taxonomy = loadIsitTaxonomy();
  const key = { taxonomy_version: taxonomy.version, model: ISIT_MODEL, prompt_version: PROMPT_VERSION };

  const newsById = new Map((await findAllBySource(ISIT_SOURCE_ID)).map((item) => [item._id, item]));
  let records = (await findAllClassifications()).filter((r) => r.workflow_status !== "approved");
  if (ids) records = records.filter((r) => ids.includes(r.news_id));

  const history = await findRunHistory(
    records.filter((r) => r.input.fingerprint).map((r) => ({ newsId: r.news_id, fingerprint: r.input.fingerprint! })),
    key
  );

  const queue: ClassifyPlan["batch"] = [];
  const exhausted: IsitClassification[] = [];
  let upToDate = 0;
  let outdatedInput = 0;
  let fetchedTooLate = 0;
  for (const record of records) {
    const id = record.news_id;
    const news = newsById.get(id);
    const past = history.get(id);
    // Not preprocessed yet (counted as `unprocessed` below), or its news item is gone.
    if (!record.input.fingerprint || !news || !past) continue;

    switch (decideClassify(record.input.fingerprint, news, past, fetchedBefore)) {
      case "fetched_too_late":
        fetchedTooLate++;
        break;
      case "outdated_input":
        outdatedInput++;
        break;
      case "up_to_date":
        upToDate++;
        break;
      case "retries_exhausted":
        exhausted.push(record);
        break;
      case "classify":
        queue.push({ record, news });
        break;
    }
  }

  return {
    key,
    candidates: records.length,
    unprocessed: records.filter((r) => !r.input.fingerprint).length,
    upToDate,
    outdatedInput,
    fetchedTooLate,
    exhausted,
    queued: queue.length,
    batch: queue.slice(0, limit),
  };
}

export interface ClassifiedRecord {
  news: AviationNews;
  result: ClassifyResult;
  workflowStatus: IsitWorkflowStatus;
  applied: boolean;
}

export interface ClassifyRunSummary {
  classified: number;
  /** Not attempted: stopped by a fatal account error or by the deadline. Picked up next run. */
  untouched: number;
  movedToReview: number;
  fatalError: string | null;
  tally: Record<string, number>;
  usage: StageUsage;
  estimatedCostUsd: number;
}

export interface ClassifyRunOptions {
  /** Stop starting new records after this moment (records in flight still finish). */
  deadline?: number;
  onRecord?: (classified: ClassifiedRecord) => void;
}

/** Records out of retries go to human review without another model call. Returns how many moved. */
async function moveToReview(exhausted: IsitClassification[]): Promise<number> {
  let moved = 0;
  for (const record of exhausted) {
    if (record.workflow_status !== "needs_review") {
      await markForReview(record.news_id, mergeFlags(record.flags, ["ai_error"]));
      moved++;
    }
  }
  return moved;
}

/** Calls the model for every record in the plan and stores the results. */
export async function runClassify(plan: ClassifyPlan, { deadline, onRecord }: ClassifyRunOptions = {}): Promise<ClassifyRunSummary> {
  const movedToReview = await moveToReview(plan.exhausted);

  const { batch, key } = plan;
  const taxonomy = loadIsitTaxonomy();
  const client = createAnthropicClient();
  const usage = emptyUsage();
  const tally: Record<string, number> = {};
  let next = 0;
  let classified = 0;
  let skipped = 0;
  // An object so the workers' closures can set it without TypeScript narrowing it to null below.
  const stop: { error: FatalClientError | null } = { error: null };

  async function worker() {
    while (next < batch.length && !stop.error && !(deadline && Date.now() >= deadline)) {
      const { record, news } = batch[next++];
      const id = record.news_id;
      const pre = preprocess(news);
      let result;
      try {
        result = await classify(news, pre, taxonomy, client);
      } catch (error) {
        if (!(error instanceof FatalClientError)) throw error;
        stop.error ??= error;
        skipped++;
        return;
      }
      const flags = mergeFlags(record.flags, result.flags);
      const workflowStatus = nextWorkflowStatus(record.workflow_status, result, flags);

      const saved = await saveRun({
        newsId: id,
        expectedFingerprint: record.input.fingerprint!,
        flags,
        workflowStatus,
        suggestion: toSuggestion(record.input.fingerprint!, key, result),
      });

      classified++;
      addUsage(usage, result.usage);
      const label = `${result.outcome ?? "FAILED"} / ${workflowStatus}`;
      tally[label] = (tally[label] ?? 0) + 1;
      onRecord?.({ news, result, workflowStatus, applied: saved.applied });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));

  return {
    classified,
    untouched: skipped + (batch.length - next),
    movedToReview,
    fatalError: stop.error?.message ?? null,
    tally,
    usage,
    estimatedCostUsd: estimateCost(ISIT_MODEL, usage) ?? 0,
  };
}
