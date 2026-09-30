import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isObjectId, isOneOf } from "./guards";

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

describe("isObjectId", () => {
  it("accepts 24 hex digits in either case", () => {
    assert.equal(isObjectId("6abc894a6487e7cb865fe81a"), true);
    assert.equal(isObjectId("6ABC894A6487E7CB865FE81A"), true);
  });

  it("rejects anything else", () => {
    for (const value of ["", "zzz", "6abc894a6487e7cb865fe81", "6abc894a6487e7cb865fe81a0", "6abc894a6487e7cb865fe81g", " 6abc894a6487e7cb865fe81a"]) {
      assert.equal(isObjectId(value), false, JSON.stringify(value));
    }
  });
});
