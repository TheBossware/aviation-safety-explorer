/**
 * Extracts airlines for news items that have none yet (every source, not only AvHerald).
 * Called by n8n after its daily ingest:
 *
 *   POST /api/airlines/run
 *   Authorization: Bearer <CRON_SECRET>
 *   Content-Type: application/json
 *   { "dryRun": false, "limit": 50 }        both optional
 *
 * A dry run only lists what would be extracted; it makes no model calls. Idempotent: items that
 * already have airlines are never touched. If the time budget runs out, `remaining` > 0 and calling
 * again continues where it stopped.
 */
import { z } from "zod";

import { planAirlines, runAirlines } from "@/lib/airline-extraction/jobs";
import { hasCronSecret } from "@/lib/shared/cron-auth";

export const maxDuration = 300;

/** Stop starting new items after this long, so in-flight ones finish before maxDuration. */
const EXTRACT_BUDGET_MS = 200_000;

const bodySchema = z.object({
  dryRun: z.boolean().default(false),
  limit: z.number().int().positive().max(500).default(50),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  if (!hasCronSecret(request)) return Response.json({ error: "unauthorized" }, { status: 401 });

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
    const plan = await planAirlines({ limit });
    if (dryRun) {
      return Response.json({
        dryRun,
        queued: plan.queued,
        thisRun: plan.batch.length,
        wouldExtract: plan.batch.map((news) => ({ id: news._id, title: news.title })),
      });
    }

    const run = await runAirlines(plan, { write: true, deadline: startedAt + EXTRACT_BUDGET_MS });
    const body = {
      dryRun,
      queued: plan.queued,
      thisRun: plan.batch.length,
      ...run,
      remaining: plan.queued - run.saved,
      durationMs: Date.now() - startedAt,
    };
    // A fatal account error (bad key, no credit) should fail the n8n node so someone notices.
    return Response.json(body, { status: run.fatalError ? 503 : 200 });
  } catch (error) {
    console.error("Airline extraction run failed", error);
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
