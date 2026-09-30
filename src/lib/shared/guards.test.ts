import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isOneOf } from "./guards";

const COLORS = ["red", "green"] as const;

describe("isOneOf", () => {
  it("accepts listed values", () => {
    assert.equal(isOneOf(COLORS, "red"), true);
    assert.equal(isOneOf(COLORS, "green"), true);
  });

  it("rejects everything else, including near misses and non-strings", () => {
    for (const value of ["RED", "", " red", undefined, null, 1, ["red"]]) {
      assert.equal(isOneOf(COLORS, value), false, String(value));
    }
  });
});
