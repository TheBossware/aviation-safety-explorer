import type { TreeViewNode } from "@/components/isit-review/tree-view";
import type { IsitTreePayload } from "@/lib/isit-taxonomy/taxonomy";

interface BuildOptions {
  /** Keep only these codes and their ancestors (e.g. to show just a suggestion). */
  include?: Iterable<string>;
  /** Extra badges/detail for specific codes. */
  decorate?: (code: string) => Pick<TreeViewNode, "badges" | "detail"> | undefined;
}

/**
 * Numeric order, not string order: 9-digit Security codes (100…) must come after the 8-digit
 * groups. Because the leading digits are the ISIT parent group, this is also IATA's group order.
 */
export function compareIsitCodes(a: string, b: string): number {
  return Number(a) - Number(b);
}

/**
 * ISIT exactly as IATA structures it: Parent group > Event type > Descriptors, every level sorted
 * by code. The event/context/contributing dimensions stay internal (they guide and validate the
 * AI); reviewers only see ISIT's own hierarchy. Node ids are the codes; level-1 groups and
 * synthesized branches are not selectable.
 */
export function buildIsitTree(payload: IsitTreePayload, options: BuildOptions = {}): TreeViewNode[] {
  const rows = new Map(payload.rows.map((row) => [row[0], row]));
  const children = new Map<string | null, string[]>();
  for (const [code, , parent] of payload.rows) {
    children.set(parent, [...(children.get(parent) ?? []), code]);
  }
  for (const list of children.values()) list.sort(compareIsitCodes);

  let allowed: Set<string> | null = null;
  if (options.include) {
    allowed = new Set<string>();
    for (const code of options.include) {
      let current: string | null = code;
      while (current && rows.has(current)) {
        allowed.add(current);
        current = rows.get(current)![2];
      }
    }
  }

  const node = (code: string): TreeViewNode => {
    const [, name, , , , selectable, definition] = rows.get(code)!;
    const kids = (children.get(code) ?? []).filter((c) => !allowed || allowed.has(c));
    return {
      id: code,
      prefix: code,
      label: name,
      description: definition,
      selectable: selectable === 1,
      children: kids.length ? kids.map(node) : undefined,
      ...options.decorate?.(code),
    };
  };

  return (children.get(null) ?? []).filter((code) => !allowed || allowed.has(code)).map(node);
}

/** Ids of every node on the way to the given codes, for `defaultExpanded`. */
export function isitAncestorIds(tree: TreeViewNode[], codes: Iterable<string>): string[] {
  const wanted = new Set(codes);
  const result: string[] = [];
  const walk = (node: TreeViewNode, path: string[]) => {
    if (wanted.has(node.id)) result.push(...path);
    node.children?.forEach((child) => walk(child, [...path, node.id]));
  };
  tree.forEach((node) => walk(node, []));
  return [...new Set(result)];
}
