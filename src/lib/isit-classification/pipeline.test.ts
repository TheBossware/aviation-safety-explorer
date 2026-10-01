import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { FatalClientError, type IsitModelClient, type StageRequest } from "./llm/client";
import type { GateOutput, RouteOutput, SelectOutput } from "./llm/schemas";
import { classify, mergeFlags, nextWorkflowStatus } from "./pipeline";
import { preprocess } from "./preprocess";
import { evidenceFound } from "./validate";

const taxonomy = loadIsitTaxonomy();

const NEWS = {
  title: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
  summary: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
  content:
    "By Simon Hradecky, created Monday, Aug 10th 2026 11:47Z, last updated Monday, Aug 10th 2026 19:15Z A Swiss Airbus A330-300 was enroute at FL380 when the crew decided to divert due to smoke in the cabin. The airline reported a powerbank of a passenger emitted smoke.",
  url: "https://avherald.com/h?article=53d51269",
  published_at: new Date("2026-08-10T12:00:00Z"),
  content_note: null,
};

const REVOCATION = {
  ...NEWS,
  title:
    "REVOCATION: The post published by us on 04.07.2025: “Incident: Go2Sky B738 at Zakynthos on Jun 29th 2025, engine trouble avherald.com/h?article=529de372” is untrue. We hereby revoke this statement.",
  content: "By Simon Hradecky, created Friday, Jul 4th 2025 08:21Z, last updated Saturday, Jul 5th 2025 08:29Z A Go2Sky Boeing 737-800 diverted to Athens.",
};

const PROCEED: GateOutput = {
  post_type: "occurrence_report",
  decision: "proceed",
  title_content_consistent: true,
  evidence_quote: "smoke in cabin",
  rationale: "An occurrence.",
};

/** Answers each stage from a script; records which stages were called. */
function fakeClient(script: { gate?: GateOutput; route?: RouteOutput; select?: SelectOutput; fail?: string }) {
  const calls: string[] = [];
  const client: IsitModelClient = {
    model: "fake",
    async run<T>(request: StageRequest<T>) {
      calls.push(request.stage);
      if (script.fail === request.stage) throw new Error("boom");
      const output = request.stage === "airlines" ? undefined : script[request.stage];
      if (!output) throw new Error(`unexpected stage ${request.stage}`);
      return {
        output: output as T,
        usage: { input_tokens: 100, output_tokens: 10, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
        servedModel: "fake",
      };
    },
  };
  return { client, calls };
}

// A real event branch/code pair for the happy path.
const eventBranch = taxonomy.router.flatMap((p) => p.eventTypes).find((b) => b.dimension === "event" && taxonomy.getEntry(b.code))!;
const eventCode = taxonomy.subtree(eventBranch.code).find((e) => e.level === 3)!;
const ROUTE: RouteOutput = { event: [{ branch_code: eventBranch.code, evidence_quote: "smoke in the cabin" }], context: [], contributing: [] };

describe("classify", () => {
  it("never assigns codes to a revocation, even if the model says proceed", async () => {
    const { client, calls } = fakeClient({ gate: PROCEED });
    const result = await classify(REVOCATION, preprocess(REVOCATION), taxonomy, client);
    assert.equal(result.outcome, "revoked");
    assert.deepEqual(result.codes, []);
    assert.deepEqual(calls, ["gate"]);
    assert.ok(result.flags.includes("revocation"));
    assert.ok(result.flags.includes("gate_conflict"));
  });

  it("stops at the gate when the model detects a revocation", async () => {
    const { client, calls } = fakeClient({ gate: { ...PROCEED, post_type: "revocation", decision: "revoked", title_content_consistent: false } });
    const result = await classify(NEWS, preprocess(NEWS), taxonomy, client);
    assert.equal(result.outcome, "revoked");
    assert.deepEqual(calls, ["gate"]);
  });

  it("classifies with a validated code", async () => {
    const { client, calls } = fakeClient({
      gate: PROCEED,
      route: ROUTE,
      select: { codes: [{ code: eventCode.code, dimension: "event", evidence_quote: "smoke in the cabin", rationale: "r", confidence: "high" }] },
    });
    const result = await classify(NEWS, preprocess(NEWS), taxonomy, client);
    assert.deepEqual(calls, ["gate", "route", "select"]);
    assert.equal(result.outcome, "classified");
    assert.deepEqual(result.codes.map((c) => c.code), [eventCode.code]);
    assert.deepEqual(result.flags, []);
  });

  it("drops invented, wrong-dimension and unsupported codes", async () => {
    const { client } = fakeClient({
      gate: PROCEED,
      route: ROUTE,
      select: {
        codes: [
          { code: "10019999", dimension: "event", evidence_quote: "smoke in the cabin", rationale: "r", confidence: "high" },
          { code: "40060000", dimension: "event", evidence_quote: "smoke in the cabin", rationale: "r", confidence: "high" },
          { code: eventCode.code, dimension: "event", evidence_quote: "the crew was fatigued", rationale: "r", confidence: "high" },
        ],
      },
    });
    const result = await classify(NEWS, preprocess(NEWS), taxonomy, client);
    assert.equal(result.outcome, "insufficient_evidence");
    assert.deepEqual(result.codes, []);
    assert.ok(result.flags.includes("code_dropped"));
    const rejected = (result.stages.select as { rejected: { reason: string }[] }).rejected.map((r) => r.reason.split(":")[0]);
    assert.deepEqual(rejected, ["unknown_code", "dimension_mismatch", "evidence quote not found in title or article"]);
  });

  it("drops a branch of the wrong dimension", async () => {
    const { client } = fakeClient({
      gate: PROCEED,
      route: { event: [{ branch_code: "40060000", evidence_quote: "x" }], context: [], contributing: [] },
    });
    const result = await classify(NEWS, preprocess(NEWS), taxonomy, client);
    assert.equal(result.outcome, "insufficient_evidence");
    assert.ok(result.flags.includes("code_dropped"));
  });

  it("returns not_applicable for non-occurrences", async () => {
    const news = { ...NEWS, title: "News: AVH was sued" };
    const { client } = fakeClient({ gate: { ...PROCEED, post_type: "non_occurrence", decision: "not_applicable" } });
    const result = await classify(news, preprocess(news), taxonomy, client);
    assert.equal(result.outcome, "not_applicable");
    assert.deepEqual(result.flags, []);
  });

  it("reports a failed AI call without an outcome", async () => {
    const { client } = fakeClient({ gate: PROCEED, fail: "route" });
    const result = await classify(NEWS, preprocess(NEWS), taxonomy, client);
    assert.equal(result.status, "failed");
    assert.equal(result.outcome, null);
    assert.match(result.error!, /boom/);
    assert.ok(result.flags.includes("ai_error"));
    assert.ok(result.stages.gate);
  });
});

describe("account-level failures", () => {
  it("propagates instead of recording a failed attempt for the record", async () => {
    const client: IsitModelClient = {
      model: "fake",
      async run() {
        throw new FatalClientError("Your credit balance is too low");
      },
    };
    await assert.rejects(classify(NEWS, preprocess(NEWS), taxonomy, client), FatalClientError);
  });
});

describe("nextWorkflowStatus", () => {
  const ok = { status: "succeeded", outcome: "classified", codes: [], flags: [], stages: {}, error: null, usage: {}, servedModels: [] } as never;

  it("never moves an approved or stale record", () => {
    assert.equal(nextWorkflowStatus("approved", ok, []), "approved");
    assert.equal(nextWorkflowStatus("stale", ok, []), "stale");
  });

  it("routes flagged or non-classified results to review", () => {
    assert.equal(nextWorkflowStatus("pending", ok, []), "ai_suggested");
    assert.equal(nextWorkflowStatus("pending", ok, ["late_report"]), "ai_suggested");
    assert.equal(nextWorkflowStatus("pending", ok, ["date_anomaly"]), "needs_review");
    assert.equal(nextWorkflowStatus("pending", { ...(ok as object), outcome: "revoked" } as never, []), "needs_review");
    assert.equal(nextWorkflowStatus("pending", { ...(ok as object), status: "failed" } as never, []), "ai_failed");
  });

  it("replaces earlier AI flags and clears input_changed, keeping preprocessing flags", () => {
    assert.deepEqual(mergeFlags(["late_report", "code_dropped", "input_changed"], ["low_confidence"]), ["late_report", "low_confidence"]);
  });
});

describe("evidenceFound", () => {
  const sources = [NEWS.title, "The crew said “smoke” was seen…  near row 12."];
  it("matches verbatim text regardless of case, whitespace and quote style", () => {
    assert.ok(evidenceFound("SMOKE IN  CABIN", sources));
    assert.ok(evidenceFound('the crew said "smoke" was seen', sources));
    assert.ok(evidenceFound("Swiss A333 ... smoke in cabin", sources));
  });

  it("rejects paraphrases and empty quotes", () => {
    assert.equal(evidenceFound("fumes in the cabin", sources), false);
    assert.equal(evidenceFound("  ", sources), false);
  });
});

describe("evidenceFound with broken source encoding", () => {
  // Real AvHerald text as stored by n8n: ’ and ° were replaced by U+FFFD.
  const article =
    "the captain�s inadequate compensation for gusting crosswind wind conditions while attempting to land. " +
    "allowed the autopilot to pitch the aircraft nose-down to -7.6� with an associated 6,240 ft/min descent rate.";

  it("matches correct quotes despite replacement characters", () => {
    assert.ok(evidenceFound("The captain's inadequate compensation for gusting crosswind wind conditions", [article]));
    assert.ok(evidenceFound("pitch the aircraft nose-down to -7.6° with an associated 6,240 ft/min descent rate", [article]));
  });

  it("still requires the words themselves, in order", () => {
    assert.equal(evidenceFound("the captain's poor compensation for gusting crosswind", [article]), false);
    assert.equal(evidenceFound("crosswind gusting", [article]), false);
    assert.equal(evidenceFound("nose-down to -7.5°", [article]), false);
  });

  it("matches whole words only", () => {
    assert.equal(evidenceFound("aptain", [article]), false);
  });
});
