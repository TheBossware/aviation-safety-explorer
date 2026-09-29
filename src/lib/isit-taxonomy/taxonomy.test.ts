import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_ISIT_VERSION, loadIsitTaxonomy } from "./taxonomy";

const taxonomy = loadIsitTaxonomy();

function rejectionReason(code: string, options?: Parameters<typeof taxonomy.validateCode>[1]) {
  const result = taxonomy.validateCode(code, options);
  return result.ok ? "ok" : result.reason;
}

describe("loading", () => {
  it("loads the default version with the expected counts", () => {
    assert.equal(taxonomy.version, DEFAULT_ISIT_VERSION);
    assert.equal(taxonomy.entries.length, 2750);
    assert.equal(new Set(taxonomy.entries.map((e) => e.code)).size, 2750);
    assert.equal(taxonomy.router.length, 10);
    assert.equal(taxonomy.router.flatMap((p) => p.eventTypes).length, 101);
  });

  it("caches per version", () => {
    assert.equal(loadIsitTaxonomy(DEFAULT_ISIT_VERSION), taxonomy);
  });

  it("refuses unknown or path-like versions", () => {
    assert.throws(() => loadIsitTaxonomy("9.9.9"));
    assert.throws(() => loadIsitTaxonomy("../0.3.12"), /Invalid ISIT version/);
  });
});

describe("tree integrity", () => {
  it("every assignable code validates and chains up to a level-1 group", () => {
    for (const entry of taxonomy.entries) {
      assert.equal(rejectionReason(entry.code, { dimension: entry.dimension }), "ok", entry.code);
      const chain = taxonomy.ancestors(entry.code);
      assert.equal(chain.length, entry.level - 1, entry.code);
      assert.equal(chain[0].code, entry.parentCode, entry.code);
      assert.equal(chain.at(-1)!.level, 1, entry.code);
    }
  });

  it("keeps one dimension per level-2 branch", () => {
    for (const eventType of taxonomy.router.flatMap((p) => p.eventTypes)) {
      for (const entry of taxonomy.subtree(eventType.code)) {
        assert.equal(entry.dimension, eventType.dimension, entry.code);
      }
    }
  });

  it("corrects the 97 descendants of Fatigue/Stress/Coordination mislabeled as context in 0.3.12", () => {
    const contributingCommon = ["40050000", "40060000", "40080000"].flatMap((branch) => taxonomy.subtree(branch));
    assert.equal(contributingCommon.length, 100); // 3 branches + 97 descendants
    assert.ok(contributingCommon.every((entry) => entry.dimension === "contributing"));
    assert.equal(rejectionReason("40050700", { dimension: "contributing" }), "ok");
    assert.equal(taxonomy.getNode("40050700")?.dimension, "contributing");
  });

  it("only 70080000 is a non-assignable level-2 branch", () => {
    const synthesized = taxonomy.router
      .flatMap((p) => p.eventTypes)
      .filter((eventType) => !taxonomy.getEntry(eventType.code))
      .map((eventType) => eventType.code);
    assert.deepEqual(synthesized, ["70080000"]);
    assert.equal(taxonomy.getNode("70080000")?.synthesized, true);
  });
});

describe("parent resolution", () => {
  it("does not treat a string prefix as a parent (9-digit Security codes)", () => {
    // "1001" is the non-zero prefix of 10010000 and also of 100010000.
    assert.equal(taxonomy.isDescendantOf("100010000", "10010000"), false);
    assert.equal(taxonomy.isDescendantOf("10010101", "10010000"), true);
    assert.deepEqual(
      taxonomy.ancestors("100010000").map((n) => n.code),
      ["100000000"]
    );
  });

  it("reaches a synthesized parent", () => {
    assert.deepEqual(
      taxonomy.ancestors("70080100").map((n) => n.code),
      ["70080000", "70000000"]
    );
  });
});

describe("validateCode", () => {
  it("rejects malformed codes", () => {
    for (const code of ["", "1001", "abcdefgh", "1234567890", " 10010100"]) {
      assert.equal(rejectionReason(code), "malformed", code);
    }
  });

  it("rejects codes missing from the taxonomy, including the dropped source row 40030118", () => {
    assert.equal(rejectionReason("40030118"), "unknown_code");
    assert.equal(rejectionReason("10019900"), "unknown_code");
  });

  it("rejects level-1 groups and synthesized branches", () => {
    assert.equal(rejectionReason("10000000"), "not_selectable");
    assert.equal(rejectionReason("100000000"), "not_selectable");
    assert.equal(rejectionReason("70080000"), "not_selectable");
    assert.equal(rejectionReason("70080100"), "ok");
  });

  it("uses the branch dimension, not the level-1 one (Common mixes context and contributing)", () => {
    assert.equal(taxonomy.getNode("40000000")?.dimension, "context");
    assert.equal(rejectionReason("40060000", { dimension: "contributing" }), "ok");
    assert.equal(rejectionReason("40060000", { dimension: "context" }), "dimension_mismatch");
    assert.equal(rejectionReason("40010000", { dimension: "event" }), "dimension_mismatch");
  });

  it("restricts codes to the routed branches", () => {
    assert.equal(rejectionReason("10010101", { withinBranches: ["10010000"] }), "ok");
    assert.equal(rejectionReason("10010000", { withinBranches: ["10010000"] }), "ok");
    assert.equal(rejectionReason("100010000", { withinBranches: ["10010000"] }), "outside_branch");
  });
});

describe("collapseRedundant", () => {
  it("keeps the most specific code of a chain and drops duplicates", () => {
    assert.deepEqual(taxonomy.collapseRedundant(["10010000", "10010100", "10010101", "10010101"]), ["10010101"]);
  });

  it("keeps unrelated codes, including prefix look-alikes", () => {
    assert.deepEqual(taxonomy.collapseRedundant(["10010000", "100010000"]), ["10010000", "100010000"]);
  });
});
