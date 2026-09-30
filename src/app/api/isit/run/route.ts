/**
 * Runs the ISIT jobs (seed → preprocess → classify) for newly ingested AvHerald news.
 * Called by n8n after its daily ingest:
 *
 *   POST /api/isit/run
 *   Authorization: Bearer <CRON_SECRET>
 *   Content-Type: application/json
 *   { "dryRun": false, "limit": 50 }        both optional
 *
 * Idempotent: records already classified with the same input/taxonomy/model/prompt are skipped.
 * If the time budget runs out, `classify.remaining` > 0 and calling again continues where it stopped.
 */
import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { planClassify, planSeed, preprocessAll, runClassify, seedPending } from "@/lib/isit-classification/jobs";

export const maxDuration = 300;

/** Stop starting new records after this long, so in-flight ones finish before maxDuration. */
const CLASSIFY_BUDGET_MS = 200_000;

const bodySchema = z.object({
  dryRun: z.boolean().default(false),
  limit: z.number().int().positive().max(500).default(50),
});

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

  const text = await request.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    return Response.json({ error: "body is not valid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  const { dryRun, limit } = parsed.data;

  try {
    const seedPlan = await planSeed();
    const seed = dryRun ? null : await seedPending(seedPlan);
    const preprocess = dryRun ? null : await preprocessAll();

    const plan = await planClassify({ limit });
    const planned = {
      candidates: plan.candidates,
      upToDate: plan.upToDate,
      notPreprocessed: plan.unprocessed,
      inputChanged: plan.outdatedInput,
      retriesExhausted: plan.exhausted.length,
      queued: plan.queued,
      thisRun: plan.batch.length,
    };

    if (dryRun) {
      return Response.json({
        dryRun,
        seed: { inScope: seedPlan.inScope.length, skipped: seedPlan.skipped.length },
        classify: { ...planned, wouldClassify: plan.batch.map(({ news }) => ({ id: news._id, title: news.title })) },
      });
    }

    const run = await runClassify(plan, { deadline: startedAt + CLASSIFY_BUDGET_MS });
    const body = {
      dryRun,
      seed,
      preprocess,
      classify: { ...planned, ...run, remaining: plan.queued - run.classified },
      durationMs: Date.now() - startedAt,
    };
    // A fatal account error (bad key, no credit) should fail the n8n node so someone notices.
    return Response.json(body, { status: run.fatalError ? 503 : 200 });
  } catch (error) {
    console.error("ISIT run failed", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
