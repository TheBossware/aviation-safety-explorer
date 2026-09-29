import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitDimension, IsitIndexEntry } from "@/lib/isit-taxonomy/types";
import type { IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import type { PreprocessResult } from "../preprocess";

/** Bump whenever any prompt text or schema changes: records classified with an older version are re-run. */
export const PROMPT_VERSION = "2026-09-29.1";

const SOURCE_FRAMING = `You classify aviation safety news from The Aviation Herald (AvHerald) against the IATA Safety Incident Taxonomy (ISIT).

Each record has two parts that can disagree:
- TITLE: the social media post this record is about. It is authoritative for what the record claims.
- ARTICLE: the AvHerald web page linked from the post. It may describe an older, different, or withdrawn story, and it accumulates later updates.

Only state what the text supports. Never infer causes, damage, injuries or flight phases that are not written.
Evidence quotes must be copied verbatim (exact words, no paraphrase) from the TITLE or the ARTICLE, at most about 200 characters.`;

export const GATE_SYSTEM = `${SOURCE_FRAMING}

Your task: decide what kind of post this is and whether it can be classified as an occurrence.

post_type:
- occurrence_report: reports an occurrence (incident, accident, crash, serious incident).
- update: new information about an earlier occurrence (e.g. an investigation or final report).
- correction: corrects details of an earlier post; the occurrence itself stands.
- revocation: withdraws an earlier post or declares it untrue.
- non_occurrence: site news, legal matters, service notices, anything that is not an occurrence.
- other: none of the above.

decision:
- revoked: the post is a revocation. The article may still tell the withdrawn story; do NOT treat that story as a confirmed occurrence.
- not_applicable: not an occurrence, so ISIT does not apply.
- insufficient_evidence: an occurrence, but the text is too vague to tell what happened.
- proceed: an occurrence (or update/correction of one) that can be classified.

title_content_consistent: true only if the article describes the same occurrence the title reports (operator/aircraft, place, date). For a revocation it is false when the article narrates the withdrawn story as fact.
evidence_quote: the words that decide post_type and decision.`;

function formatDate(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "unknown";
}

export function recordBlock(news: Pick<AviationNews, "title" | "content" | "published_at">, pre: PreprocessResult): string {
  return `TITLE: ${news.title}

Posted: ${formatDate(news.published_at ? new Date(news.published_at) : null)}
Occurrence date from title: ${formatDate(pre.eventDate)}
Article created: ${formatDate(pre.articleCreatedAt)}, last updated: ${formatDate(pre.articleUpdatedAt)}
Automatic checks: ${pre.flags.length ? pre.flags.join(", ") : "none"}

ARTICLE:
${news.content || "(no article text)"}`;
}

const DIMENSION_GUIDE = `ISIT has three separate dimensions. Treat them independently:
- event: what happened (the occurrence itself).
- context: circumstances and consequences (phase of operation, aircraft damage and its source/area, corrective actions, operational impact).
- contributing: why it happened (environment, preconditions, organization, supervision, individual actions, fatigue, stress, coordination/communication). Only when the text explicitly states a cause or factor (e.g. "due to", an investigation finding, an official statement). Speculation, "possibly", reader comments and your own inference do not count.`;

export function routeSystem(taxonomy: IsitTaxonomy): string {
  const lines: string[] = [];
  for (const dimension of ["event", "context", "contributing"] as const) {
    lines.push(`\n${dimension.toUpperCase()} branches:`);
    for (const parent of taxonomy.router) {
      for (const branch of parent.eventTypes) {
        if (branch.dimension !== dimension) continue;
        lines.push(`${branch.code} | ${parent.name} > ${branch.name}${branch.definition ? ` | ${branch.definition}` : ""}`);
      }
    }
  }

  return `${SOURCE_FRAMING}

${DIMENSION_GUIDE}

Your task: pick the ISIT level-2 branches whose codes could describe this record, per dimension. A later step picks the exact codes inside the branches you choose, so choose every branch that plausibly fits, but only if the text supports it.
- Up to 3 branches per dimension; an empty list is correct when nothing is supported.
- Use only branch codes from the lists below, under the matching dimension.
- Give a verbatim evidence_quote for each branch.
${lines.join("\n")}`;
}

export const SELECT_SYSTEM = `${SOURCE_FRAMING}

${DIMENSION_GUIDE}

Your task: choose the ISIT codes that describe this record, from the candidate lists in the message only.
- Choose the most specific code the text supports. If the text does not support a more specific descendant, choose the higher-level code instead (never guess the detail).
- Several codes may apply, also within one dimension; do not list a code together with its own ancestor.
- Each code keeps the dimension it is listed under.
- Give a verbatim evidence_quote, a one-sentence rationale and a confidence (high: stated explicitly; medium: clearly implied by stated facts; low: plausible but uncertain) for each code.
- Return an empty list if nothing is supported.`;

function candidateLines(entries: IsitIndexEntry[]): string {
  return entries.map((e) => `${e.code} | ${e.label}${e.definition ? ` | ${e.definition}` : ""}`).join("\n");
}

export function selectUser(record: string, candidates: Record<IsitDimension, IsitIndexEntry[]>): string {
  const sections = (["event", "context", "contributing"] as const)
    .filter((dimension) => candidates[dimension].length)
    .map((dimension) => `${dimension.toUpperCase()} candidates:\n${candidateLines(candidates[dimension])}`);
  return `${record}\n\n---\n\n${sections.join("\n\n")}`;
}
