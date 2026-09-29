import type { IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { ISIT_DIMENSIONS, type IsitDimension } from "@/lib/isit-taxonomy/types";
import type { RouteOutput, SelectOutput } from "./llm/schemas";
import type { IsitCodeAssignment } from "./types";

/** Nothing the model returns is trusted: codes, branches and quotes are all re-checked here. */

function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** True when every part of the quote (split on ellipses) appears verbatim in one of the sources. */
export function evidenceFound(quote: string, sources: string[]): boolean {
  const haystack = sources.map(normalizeForMatch);
  const parts = quote
    .split(/\.\.\.|…/)
    .map(normalizeForMatch)
    .map((part) => part.replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
  return parts.length > 0 && parts.every((part) => haystack.some((text) => text.includes(part)));
}

export interface Rejection {
  code: string;
  dimension: IsitDimension;
  reason: string;
}

export type RoutedBranches = Record<IsitDimension, string[]>;

/** A routed branch must be a level-2 node of the stated dimension (synthesized branches are fine as containers). */
export function validateRoute(route: RouteOutput, taxonomy: IsitTaxonomy): { branches: RoutedBranches; rejected: Rejection[] } {
  const branches: RoutedBranches = { event: [], context: [], contributing: [] };
  const rejected: Rejection[] = [];
  for (const dimension of ISIT_DIMENSIONS) {
    for (const { branch_code: code } of route[dimension]) {
      const node = taxonomy.getNode(code);
      if (!node || node.level !== 2) {
        rejected.push({ code, dimension, reason: "not a level-2 branch" });
      } else if (node.dimension !== dimension) {
        rejected.push({ code, dimension, reason: `branch is ${node.dimension}` });
      } else if (!branches[dimension].includes(code)) {
        branches[dimension].push(code);
      }
    }
  }
  return { branches, rejected };
}

export interface ValidatedSelection {
  accepted: IsitCodeAssignment[];
  rejected: Rejection[];
  lowConfidence: string[];
}

export function validateSelection(
  selection: SelectOutput,
  branches: RoutedBranches,
  taxonomy: IsitTaxonomy,
  sources: string[]
): ValidatedSelection {
  const rejected: Rejection[] = [];
  const valid: Array<{ assignment: IsitCodeAssignment; confidence: string }> = [];

  for (const pick of selection.codes) {
    const result = taxonomy.validateCode(pick.code, { dimension: pick.dimension, withinBranches: branches[pick.dimension] });
    if (!result.ok) {
      rejected.push({ code: pick.code, dimension: pick.dimension, reason: `${result.reason}: ${result.message}` });
      continue;
    }
    if (!evidenceFound(pick.evidence_quote, sources)) {
      rejected.push({ code: pick.code, dimension: pick.dimension, reason: "evidence quote not found in title or article" });
      continue;
    }
    valid.push({
      assignment: {
        code: result.entry.code,
        dimension: result.entry.dimension,
        label: result.entry.label,
        evidence_quote: pick.evidence_quote,
        rationale: pick.rationale,
      },
      confidence: pick.confidence,
    });
  }

  const kept = new Set(taxonomy.collapseRedundant(valid.map((v) => v.assignment.code)));
  const accepted: IsitCodeAssignment[] = [];
  for (const { assignment } of valid) {
    if (!kept.has(assignment.code) || accepted.some((a) => a.code === assignment.code)) continue;
    accepted.push(assignment);
  }
  const lowConfidence = valid
    .filter((v) => v.confidence === "low" && kept.has(v.assignment.code))
    .map((v) => v.assignment.code);

  return { accepted, rejected, lowConfidence: [...new Set(lowConfidence)] };
}
