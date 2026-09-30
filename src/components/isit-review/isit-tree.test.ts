import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { TreeViewNode } from "@/components/isit-review/tree-view";
import { loadIsitTaxonomy, toTreePayload } from "@/lib/isit-taxonomy/taxonomy";
import { buildIsitTree, compareIsitCodes, isitAncestorIds } from "./isit-tree";

const payload = toTreePayload(loadIsitTaxonomy());

function flatten(nodes: TreeViewNode[]): TreeViewNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

describe("buildIsitTree", () => {
  const tree = buildIsitTree(payload);
  const all = flatten(tree);

  it("uses ISIT's own ten parent groups as roots, in code order", () => {
    assert.deepEqual(
      tree.map((n) => n.id),
      ["10000000", "20000000", "30000000", "40000000", "50000000", "60000000", "70000000", "80000000", "90000000", "100000000"]
    );
    assert.ok(tree.every((n) => n.selectable === false));
  });

  it("contains every assignable code exactly once", () => {
    const ids = all.map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(all.filter((n) => n.selectable).length, 2750);
  });

  it("sorts every level numerically", () => {
    const check = (nodes: TreeViewNode[]) => {
      const codes = nodes.map((n) => n.id);
      assert.deepEqual(codes, [...codes].sort(compareIsitCodes));
      nodes.forEach((n) => n.children && check(n.children));
    };
    check(tree);
  });

  it("keeps Common as one group holding all of its branches", () => {
    const common = tree.find((n) => n.id === "40000000")!;
    assert.ok(common.children!.some((n) => n.id === "40010000"));
    assert.ok(common.children!.some((n) => n.id === "40060000"));
  });

  it("keeps synthesized branches as non-selectable containers", () => {
    const node = all.find((n) => n.id === "70080000")!;
    assert.equal(node.selectable, false);
    assert.ok(node.children!.some((n) => n.id === "70080100" && n.selectable));
  });

  it("prunes to the included codes and their ancestors, in code order", () => {
    const pruned = flatten(buildIsitTree(payload, { include: ["70010600", "50030303", "40010200"] }));
    assert.deepEqual(
      pruned.map((n) => n.id),
      ["40000000", "40010000", "40010200", "50000000", "50030000", "50030300", "50030303", "70000000", "70010000", "70010600"]
    );
  });

  it("finds the path to preselected codes for initial expansion", () => {
    assert.deepEqual(isitAncestorIds(tree, ["50030303"]), ["50000000", "50030000", "50030300"]);
  });
});

describe("compareIsitCodes", () => {
  it("orders 9-digit Security codes after the 8-digit groups", () => {
    assert.deepEqual(["100010000", "90010000", "10010000"].sort(compareIsitCodes), ["10010000", "90010000", "100010000"]);
  });
});
