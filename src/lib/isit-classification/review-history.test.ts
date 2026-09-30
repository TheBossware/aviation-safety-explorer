import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { describeReviewEvent } from "./review-history";
import type { IsitCodeAssignment } from "./types";

const DIVERSION: IsitCodeAssignment = {
  code: "40090200",
  dimension: "context",
  label: "Common > Operational Impact > Diversion",
  evidence_quote: null,
  rationale: null,
};

describe("describeReviewEvent", () => {
  it("describes outcome changes, including from no outcome", () => {
    assert.equal(
      describeReviewEvent({ action: "set_outcome", before: "classified", after: "revoked" }),
      "outcome classified → revoked"
    );
    assert.equal(describeReviewEvent({ action: "set_outcome", before: null, after: "classified" }), "outcome none → classified");
  });

  it("names removed and added codes", () => {
    assert.equal(
      describeReviewEvent({ action: "reject_code", before: DIVERSION, after: null }),
      "removed 40090200 Common > Operational Impact > Diversion"
    );
    assert.equal(
      describeReviewEvent({ action: "add_code", before: null, after: DIVERSION }),
      "added 40090200 Common > Operational Impact > Diversion"
    );
  });

  it("leaves the code out when the stored value is not a code assignment", () => {
    assert.equal(describeReviewEvent({ action: "add_code", before: null, after: null }), "added ");
    assert.equal(describeReviewEvent({ action: "add_code", before: null, after: "40090200" }), "added ");
  });

  it("tells a first approval from an update of an approved result", () => {
    assert.equal(describeReviewEvent({ action: "approve", before: null, after: {} }), "approved");
    assert.equal(describeReviewEvent({ action: "approve", before: { outcome: "classified" }, after: {} }), "updated the approved result");
  });

  it("falls back to the action name", () => {
    assert.equal(describeReviewEvent({ action: "comment", before: null, after: null }), "comment");
    assert.equal(describeReviewEvent({ action: "confirm_relation", before: null, after: null }), "confirm_relation");
  });
});
