/**
 * ISIT mixes three different questions into one code table. They are kept apart so an
 * "event" slot can never be filled with e.g. Phase of Operation (context) or Fatigue
 * (contributing).
 *   event        - what happened
 *   context      - circumstances / consequences of the occurrence
 *   contributing - why it happened
 */
export type IsitDimension = "event" | "context" | "contributing";

export const ISIT_DIMENSIONS: readonly IsitDimension[] = ["event", "context", "contributing"];

/** 1 = parent group, 2 = event type, 3-4 = descriptors. */
export type IsitLevel = 1 | 2 | 3 | 4;

/** One assignable code, as stored in `isit-index.json`. */
export interface IsitIndexEntry {
  code: string;
  level: 2 | 3 | 4;
  dimension: IsitDimension;
  name: string;
  path: string[];
  label: string;
  parentCode: string;
  definition: string | null;
  isLeaf: boolean;
}

export interface IsitIndexFile {
  meta: {
    taxonomy: string;
    version: string;
    counts: {
      level1: number;
      level2: number;
      level3: number;
      level4: number;
      selectable: number;
      withDefinition: number;
    };
  };
  entries: IsitIndexEntry[];
}

export interface IsitRouterEventType {
  code: string;
  name: string;
  dimension: IsitDimension;
  definition: string | null;
  descriptorCount: number;
}

export interface IsitRouterParentLevel {
  code: string;
  level: 1;
  name: string;
  /** Not reliable for routing: `Common` is "context" but holds contributing branches. Use the event type's own dimension. */
  dimension: IsitDimension;
  eventTypes: IsitRouterEventType[];
}

export interface IsitRouterFile {
  meta: { taxonomy: string; version: string };
  parentLevels: IsitRouterParentLevel[];
}

/**
 * Any node in the tree, including the ones that cannot be assigned: level-1 group headers
 * and synthesized branches that have descendants but no official row in the source sheet
 * (e.g. 70080000 Flight Operations > Regulatory Oversight).
 */
export interface IsitNode {
  code: string;
  level: IsitLevel;
  name: string;
  label: string;
  definition: string | null;
  dimension: IsitDimension;
  parentCode: string | null;
  selectable: boolean;
  /** Level >= 2 node with no row of its own in the source sheet. */
  synthesized: boolean;
}

export type IsitCodeRejection =
  | "malformed"
  | "unknown_code"
  | "not_selectable"
  | "dimension_mismatch"
  | "outside_branch";

export type IsitCodeValidation =
  | { ok: true; entry: IsitIndexEntry }
  | { ok: false; code: string; reason: IsitCodeRejection; message: string };
