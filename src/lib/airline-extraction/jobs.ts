/**
 * Airline extraction for news items that have none yet: one model call per item, result written
 * to `airlines` / `airline_roles` / `airlines_extracted_*` in `aviation_news`. Used by
 * `scripts/airlines-extract.ts` and the `/api/airlines/run` route that n8n calls after each ingest.
 */
import { airlineCounts, countMissingAirlines, findMissingAirlines, saveAirlines } from "@/lib/aviation-news/repository";
import type { AirlineExtraction, AviationNews } from "@/lib/aviation-news/types";
import {
  addUsage,
  createAnthropicClient,
  emptyUsage,
  FatalClientError,
  ISIT_MODEL,
  type StageUsage,
} from "@/lib/isit-classification/llm/client";
import { estimateCost } from "@/lib/isit-classification/llm/pricing";
import { extractedByLabel, toExtraction } from "./extract";
import { AIRLINE_PROMPT_VERSION, airlineSystem, airlineUser } from "./llm/prompts";
import { AirlineExtractionSchema } from "./llm/schemas";

/** Model calls in flight at once. */
const CONCURRENCY = 3;

export interface AirlinePlan {
  /** All items without airlines; `batch` is the first `limit` of them, newest first. */
  queued: number;
  batch: AviationNews[];
  /** Spellings already in use, given to the model so it reuses them. */
  knownNames: string[];
}

export async function planAirlines({ limit = 50 }: { limit?: number } = {}): Promise<AirlinePlan> {
  const [queued, batch, counts] = await Promise.all([countMissingAirlines(), findMissingAirlines(limit), airlineCounts()]);
  return { queued, batch, knownNames: counts.map((count) => count.name) };
}

export interface ExtractedItem {
  news: AviationNews;
  extraction: AirlineExtraction;
  /** False on a dry run, or when the item got airlines from elsewhere in the meantime. */
  saved: boolean;
}

export interface AirlineRunSummary {
  extracted: number;
  saved: number;
  /** Model call failed for the item; it stays without airlines and is retried next run. */
  failed: number;
  /** Not attempted: stopped by a fatal account error or by the deadline. */
  untouched: number;
  fatalError: string | null;
  usage: StageUsage;
  estimatedCostUsd: number;
}

export interface AirlineRunOptions {
  /** Without it nothing is written (dry run). */
  write?: boolean;
  /** Stop starting new items after this moment (items in flight still finish). */
  deadline?: number;
  onItem?: (item: ExtractedItem) => void;
}

export async function runAirlines(plan: AirlinePlan, { write = false, deadline, onItem }: AirlineRunOptions = {}): Promise<AirlineRunSummary> {
  const { batch, knownNames } = plan;
  const client = createAnthropicClient();
  const system = airlineSystem(knownNames);
  const usage = emptyUsage();
  let next = 0;
  let extracted = 0;
  let saved = 0;
  let failed = 0;
  let skipped = 0;
  // An object so the workers' closures can set it without TypeScript narrowing it to null below.
  const stop: { error: FatalClientError | null } = { error: null };

  async function worker() {
    while (next < batch.length && !stop.error && !(deadline && Date.now() >= deadline)) {
      const news = batch[next++];
      let response;
      try {
        response = await client.run({ stage: "airlines", system, user: airlineUser(news), schema: AirlineExtractionSchema });
      } catch (error) {
        if (error instanceof FatalClientError) {
          stop.error ??= error;
          skipped++;
          return;
        }
        console.error(`airline extraction failed for news ${news._id}:`, error);
        failed++;
        continue;
      }
      addUsage(usage, response.usage);

      const extraction = toExtraction(response.output, extractedByLabel(response.servedModel, AIRLINE_PROMPT_VERSION));
      const itemSaved = write ? await saveAirlines(news._id, extraction) : false;
      extracted++;
      if (itemSaved) saved++;
      onItem?.({ news, extraction, saved: itemSaved });
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, batch.length) }, worker));

  return {
    extracted,
    saved,
    failed,
    untouched: skipped + (batch.length - next),
    fatalError: stop.error?.message ?? null,
    usage,
    estimatedCostUsd: estimateCost(ISIT_MODEL, usage) ?? 0,
  };
}
