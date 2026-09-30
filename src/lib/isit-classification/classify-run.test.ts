import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AviationNews } from "@/lib/aviation-news/types";
import { decideClassify, MAX_ATTEMPTS, toSuggestion } from "./classify-run";
import type { ClassifyResult } from "./pipeline";
import { PIPELINE_VERSION } from "./pipeline";
import { preprocess } from "./preprocess";

const NEWS = {
  _id: "6a0000000000000000000001",
  source_id: "avherald",
  title: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
  summary: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
  content:
    "By Simon Hradecky, created Monday, Aug 10th 2026 11:47Z, last updated Monday, Aug 10th 2026 19:15Z A Swiss Airbus A330-300 ...",
  url: "https://avherald.com/h?article=53d51269",
  published_at: new Date("2026-08-10T12:00:00Z"),
  fetched_at: new Date("2026-08-10T13:00:00Z"),
  content_note: null,
} as AviationNews;

const FINGERPRINT = preprocess(NEWS).fingerprint;
const NEVER_RUN = { succeeded: false, failedAttempts: 0 };

describe("decideClassify", () => {
  it("classifies a preprocessed record that never ran", () => {
    assert.equal(decideClassify(FINGERPRINT, NEWS, NEVER_RUN), "classify");
  });

  it("retries a record that failed fewer than MAX_ATTEMPTS times", () => {
    assert.equal(decideClassify(FINGERPRINT, NEWS, { succeeded: false, failedAttempts: MAX_ATTEMPTS - 1 }), "classify");
  });

  it("sends a record to review after MAX_ATTEMPTS failures", () => {
    assert.equal(decideClassify(FINGERPRINT, NEWS, { succeeded: false, failedAttempts: MAX_ATTEMPTS }), "retries_exhausted");
  });

  it("skips a record already classified with this input and configuration, even after failures", () => {
    assert.equal(decideClassify(FINGERPRINT, NEWS, { succeeded: true, failedAttempts: 0 }), "up_to_date");
    assert.equal(decideClassify(FINGERPRINT, NEWS, { succeeded: true, failedAttempts: MAX_ATTEMPTS }), "up_to_date");
  });

  it("skips a record whose news changed since preprocessing, before looking at its run history", () => {
    const changed = { ...NEWS, content: `${NEWS.content} Update: the crew returned.` };
    assert.equal(decideClassify(FINGERPRINT, changed, NEVER_RUN), "outdated_input");
    assert.equal(decideClassify(FINGERPRINT, changed, { succeeded: true, failedAttempts: 0 }), "outdated_input");
  });

  it("skips news fetched at or after the cut-off, before anything else", () => {
    const changed = { ...NEWS, content: "changed" };
    assert.equal(decideClassify(FINGERPRINT, NEWS, NEVER_RUN, new Date("2026-08-10T13:00:00Z")), "fetched_too_late");
    assert.equal(decideClassify(FINGERPRINT, changed, NEVER_RUN, new Date("2026-08-01T00:00:00Z")), "fetched_too_late");
    assert.equal(decideClassify(FINGERPRINT, NEWS, NEVER_RUN, new Date("2026-08-10T13:00:01Z")), "classify");
    assert.equal(decideClassify(FINGERPRINT, NEWS, NEVER_RUN, null), "classify");
  });
});

describe("toSuggestion", () => {
  const key = { taxonomy_version: "0.3.12", model: "claude-opus-5-5", prompt_version: "2026-09-29.1" };
  const usage = { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 };

  it("stores the run with its input fingerprint, configuration, pipeline version and served models", () => {
    const result: ClassifyResult = {
      status: "succeeded",
      outcome: "not_applicable",
      codes: [],
      flags: ["gate_conflict"],
      stages: { gate: { decision: "not_applicable" } },
      error: null,
      usage,
      servedModels: ["claude-opus-5-5"],
    };
    assert.deepEqual(toSuggestion("fp1", key, result), {
      status: "succeeded",
      input_fingerprint: "fp1",
      taxonomy_version: "0.3.12",
      model: "claude-opus-5-5",
      prompt_version: "2026-09-29.1",
      pipeline_version: PIPELINE_VERSION,
      outcome: "not_applicable",
      codes: [],
      flags: ["gate_conflict"],
      stages: { gate: { decision: "not_applicable" }, served_models: ["claude-opus-5-5"] },
      error: null,
      usage,
    });
  });

  it("keeps the error of a failed run", () => {
    const failed: ClassifyResult = {
      status: "failed",
      outcome: null,
      codes: [],
      flags: ["ai_error"],
      stages: {},
      error: "gate: overloaded",
      usage,
      servedModels: [],
    };
    const suggestion = toSuggestion("fp1", key, failed);
    assert.equal(suggestion.status, "failed");
    assert.equal(suggestion.outcome, null);
    assert.equal(suggestion.error, "gate: overloaded");
  });
});
