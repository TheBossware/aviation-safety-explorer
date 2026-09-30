import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { buildReview, type ReviewSubmission } from "./review";
import type { IsitCodeAssignment } from "./types";

const taxonomy = loadIsitTaxonomy();
const NEWS_ID = "6a7c2e504c964ff3f292ffff";

const code = (c: string): IsitCodeAssignment => {
  const entry = taxonomy.getEntry(c)!;
  return { code: c, dimension: entry.dimension, label: entry.label, evidence_quote: "q", rationale: "r" };
};

const record = {
  news_id: NEWS_ID,
  final: null,
  ai: {
    suggestion_id: "s1",
    outcome: "classified" as const,
    codes: [code("60460202"), code("40090200")],
    created_at: new Date(),
  },
};

const submit = (overrides: Partial<ReviewSubmission> = {}): ReviewSubmission => ({
  actor: "Reviewer",
  outcome: "classified",
  codes: ["60460202", "40090200"],
  note: null,
  ...overrides,
});

describe("buildReview", () => {
  it("approves the suggestion as-is with a single approve event", () => {
    const result = buildReview(record, submit(), taxonomy);
    assert.ok(result.ok);
    assert.deepEqual(result.final.codes.map((c) => c.code), ["60460202", "40090200"]);
    assert.equal(result.final.approved_by, "Reviewer");
    assert.equal(result.final.taxonomy_version, taxonomy.version);
    assert.deepEqual(result.events.map((e) => e.action), ["approve"]);
    assert.equal(result.events[0].suggestion_id, "s1");
  });

  it("records removed and added codes with before/after values", () => {
    const result = buildReview(record, submit({ codes: ["60460202", "40091200"] }), taxonomy);
    assert.ok(result.ok);
    assert.deepEqual(result.events.map((e) => e.action), ["reject_code", "add_code", "approve"]);
    assert.equal((result.events[0].before as IsitCodeAssignment).code, "40090200");
    assert.equal((result.events[1].after as IsitCodeAssignment).code, "40091200");
    assert.equal((result.events[1].after as IsitCodeAssignment).evidence_quote, null);
  });

  it("validates added codes like AI codes and takes the dimension from the code", () => {
    for (const bad of ["40030118", "70080000", "10000000", "abc"]) {
      const result = buildReview(record, submit({ codes: ["60460202", bad] }), taxonomy);
      assert.equal(result.ok, false, bad);
    }
    const result = buildReview(record, submit({ codes: ["60460202", "40060000"] }), taxonomy);
    assert.ok(result.ok);
    assert.equal(result.final.codes.find((c) => c.code === "40060000")?.dimension, "contributing");
  });

  it("drops codes for non-classified outcomes and logs the outcome change", () => {
    const result = buildReview(record, submit({ outcome: "revoked", note: "Source withdrew it" }), taxonomy);
    assert.ok(result.ok);
    assert.deepEqual(result.final.codes, []);
    assert.deepEqual(result.events.map((e) => e.action), ["set_outcome", "reject_code", "reject_code", "approve"]);
    assert.equal(result.events.at(-1)!.comment, "Source withdrew it");
  });

  it("requires an event code and a reviewer", () => {
    assert.equal(buildReview(record, submit({ codes: ["40090200"] }), taxonomy).ok, false);
    assert.equal(buildReview(record, submit({ actor: "  " }), taxonomy).ok, false);
  });

  it("re-review starts from the earlier final, not the AI suggestion", () => {
    const first = buildReview(record, submit({ codes: ["60460202"] }), taxonomy);
    assert.ok(first.ok);
    const again = buildReview({ ...record, final: first.final }, submit({ codes: ["60460202"] }), taxonomy);
    assert.ok(again.ok);
    assert.deepEqual(again.events.map((e) => e.action), ["approve"]);
    assert.equal(again.events[0].before, first.final);
  });
});
