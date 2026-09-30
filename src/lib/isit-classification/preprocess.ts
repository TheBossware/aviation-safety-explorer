import { createHash } from "node:crypto";

import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitClassification, IsitRelation, IsitWorkflowStatus } from "./types";

/**
 * Deterministic, model-free preparation of a news item. Its flags steer routing (e.g. a
 * retraction never reaches code assignment unreviewed); nothing here decides a final outcome.
 */

/** Flags owned by preprocessing: recomputed on every run, other flags are left alone. */
export const PREPROCESS_FLAGS = [
  /** Title announces a revocation/retraction/correction; `content` may still hold the withdrawn story. */
  "retraction_candidate",
  /** Title embeds a link to an AvHerald article, i.e. it talks about another post. */
  "title_references_other_post",
  /** Title prefix marks a non-occurrence post ("News:"). */
  "non_occurrence_candidate",
  /** Posted more than LATE_REPORT_DAYS after the occurrence: likely an update/final report, not a new event. */
  "late_report",
  /** Dates contradict each other (occurrence after posting, article created after posting...). */
  "date_anomaly",
  /** Occurrence-type title without a parsable occurrence date. */
  "missing_event_date",
  /** No usable article text; only the title can be used as evidence. */
  "missing_content",
] as const;

export type PreprocessFlag = (typeof PREPROCESS_FLAGS)[number];

export const LATE_REPORT_DAYS = 30;
/** Slack for timezones: AvHerald dates are local or UTC, posts are UTC. */
const DATE_TOLERANCE_MS = 36 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export interface PreprocessResult {
  fingerprint: string;
  eventDate: Date | null;
  articleCreatedAt: Date | null;
  articleUpdatedAt: Date | null;
  flags: PreprocessFlag[];
  /** Article id linked from the title, e.g. the post a REVOCATION withdraws. */
  referencedArticleId: string | null;
}

function normalize(text: string | null | undefined): string {
  return (text ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
}

/**
 * Change detector for everything the classification reads. n8n's `content_hash` covers only
 * url + normalized title, so it misses content edits.
 */
export function fingerprint(news: Pick<AviationNews, "title" | "summary" | "content" | "url">): string {
  const parts = [news.title, news.summary, news.content, news.url].map(normalize);
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

function utcDate(year: number, monthName: string, day: number, hours = 0, minutes = 0): Date | null {
  const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
  if (month === undefined) return null;
  const date = new Date(Date.UTC(year, month, day, hours, minutes));
  // Rejects overflow such as "Feb 31st" that Date.UTC silently rolls over.
  return date.getUTCMonth() === month && date.getUTCDate() === day ? date : null;
}

/** Occurrence date from an AvHerald title: "... on Aug 10th 2026, ...". Lenient on the ordinal ("28h"). */
export function parseEventDate(title: string): Date | null {
  const match = title.match(/\bon ([A-Z][a-z]{2}) (\d{1,2})[a-z]{0,2} (\d{4})\b/);
  return match ? utcDate(Number(match[3]), match[1], Number(match[2])) : null;
}

const HEADER_DATE = String.raw`[A-Za-z]+, ([A-Z][a-z]{2}) (\d{1,2})[a-z]{0,2} (\d{4}) (\d{2}):(\d{2})Z`;
const HEADER = new RegExp(String.raw`created ${HEADER_DATE}(?:, last updated ${HEADER_DATE})?`);

/** "By Simon Hradecky, created Friday, Jul 4th 2025 08:21Z, last updated Saturday, Jul 5th 2025 08:29Z" */
export function parseArticleHeader(content: string): { createdAt: Date | null; updatedAt: Date | null } {
  const match = content.slice(0, 400).match(HEADER);
  if (!match) return { createdAt: null, updatedAt: null };
  const at = (offset: number) =>
    match[offset]
      ? utcDate(Number(match[offset + 2]), match[offset], Number(match[offset + 1]), Number(match[offset + 3]), Number(match[offset + 4]))
      : null;
  return { createdAt: at(1), updatedAt: at(6) };
}

// Editorial wording only: plain "retract" is aviation vocabulary ("could not retract landing gear").
const RETRACTION_TITLE = /^\s*(revocation|retraction|correction)\s*:|\bhereby (revoke|retract)\b|\bis untrue\b|\bwe retract\b/i;
const OCCURRENCE_PREFIX = /^\s*(incident|accident|crash|report)\s*:/i;
const NON_OCCURRENCE_PREFIX = /^\s*news\s*:/i;
const TITLE_ARTICLE_LINK = /avherald\.com\/h\?article=([0-9a-f]+)/i;

export function preprocess(
  news: Pick<AviationNews, "title" | "summary" | "content" | "url" | "published_at" | "content_note">
): PreprocessResult {
  const flags = new Set<PreprocessFlag>();
  const title = news.title ?? "";

  if (RETRACTION_TITLE.test(title)) flags.add("retraction_candidate");
  const referencedArticleId = title.match(TITLE_ARTICLE_LINK)?.[1]?.toLowerCase() ?? null;
  if (referencedArticleId) flags.add("title_references_other_post");
  if (NON_OCCURRENCE_PREFIX.test(title)) flags.add("non_occurrence_candidate");

  const content = news.content ?? "";
  if (!content.trim() || news.content_note) flags.add("missing_content");

  const eventDate = parseEventDate(title);
  const { createdAt, updatedAt } = parseArticleHeader(content);
  const publishedAt = news.published_at ? new Date(news.published_at) : null;

  if (!eventDate && OCCURRENCE_PREFIX.test(title)) flags.add("missing_event_date");

  if (eventDate && publishedAt) {
    if (eventDate.getTime() > publishedAt.getTime() + DATE_TOLERANCE_MS) flags.add("date_anomaly");
    if (publishedAt.getTime() - eventDate.getTime() > LATE_REPORT_DAYS * DAY_MS) flags.add("late_report");
  }
  if (createdAt && publishedAt && createdAt.getTime() > publishedAt.getTime() + DATE_TOLERANCE_MS) {
    flags.add("date_anomaly");
  }
  if (eventDate && createdAt && eventDate.getTime() > createdAt.getTime() + DATE_TOLERANCE_MS) {
    flags.add("date_anomaly");
  }

  return {
    fingerprint: fingerprint(news),
    eventDate,
    articleCreatedAt: createdAt,
    articleUpdatedAt: updatedAt,
    flags: PREPROCESS_FLAGS.filter((flag) => flags.has(flag)),
    referencedArticleId,
  };
}

export interface RelationInput {
  newsId: string;
  articleId: string | null;
  referencedArticleId: string | null;
  isRetraction: boolean;
}

/**
 * Suggested links between records; all unconfirmed. Sharing an article id is never treated as
 * "same event": a REVOCATION post carries the URL of the very article it withdraws.
 */
export function buildRelations(items: RelationInput[]): Map<string, IsitRelation[]> {
  const byArticle = new Map<string, string[]>();
  for (const item of items) {
    if (!item.articleId) continue;
    byArticle.set(item.articleId, [...(byArticle.get(item.articleId) ?? []), item.newsId]);
  }

  const relations = new Map<string, IsitRelation[]>();
  for (const item of items) {
    const list: IsitRelation[] = [];
    const revokedArticle = item.isRetraction ? (item.referencedArticleId ?? item.articleId) : null;

    if (revokedArticle) {
      const targets = (byArticle.get(revokedArticle) ?? []).filter((id) => id !== item.newsId);
      if (targets.length) {
        for (const id of targets) list.push({ type: "revokes", news_id: id, article_id: revokedArticle, confirmed: false });
      } else {
        // The withdrawn post is not in aviation_news (or not yet): keep the article id.
        list.push({ type: "revokes", news_id: null, article_id: revokedArticle, confirmed: false });
      }
    }

    if (item.articleId) {
      for (const id of byArticle.get(item.articleId) ?? []) {
        if (id === item.newsId || list.some((relation) => relation.news_id === id)) continue;
        list.push({ type: "same_article", news_id: id, article_id: item.articleId, confirmed: false });
      }
    }

    relations.set(item.newsId, list);
  }
  return relations;
}

/** Added when the input changed after an AI run or approval; cleared by the next review/AI run. */
export const INPUT_CHANGED_FLAG = "input_changed";

type PlanCurrent = Pick<IsitClassification, "workflow_status" | "flags" | "relations"> & {
  input: Pick<IsitClassification["input"], "fingerprint">;
  dates: IsitClassification["dates"];
};

export interface PreprocessPlan {
  changed: boolean;
  inputChanged: boolean;
  set: {
    "input.fingerprint": string;
    dates: { event_date: Date | null; article_created_at: Date | null; article_updated_at: Date | null };
    flags: string[];
    relations: IsitRelation[];
    workflow_status: IsitWorkflowStatus;
  };
}

function sameTime(a: Date | string | null | undefined, b: Date | null): boolean {
  return (a ? new Date(a).getTime() : null) === (b ? b.getTime() : null);
}

/**
 * How a stored record changes after preprocessing. A changed input sends AI-only results back to
 * `pending`; a human-approved one becomes `stale` and keeps its `final` until someone re-reviews it.
 */
export function planPreprocessUpdate(current: PlanCurrent, result: PreprocessResult, relations: IsitRelation[]): PreprocessPlan {
  const inputChanged = current.input.fingerprint !== null && current.input.fingerprint !== result.fingerprint;

  // Keep the stored order (other stages' flags interleave with ours) and only add or drop our own.
  const owned = new Set<string>(PREPROCESS_FLAGS);
  const wanted = new Set<string>(result.flags);
  const flags = current.flags.filter((flag) => !owned.has(flag) || wanted.has(flag));
  for (const flag of result.flags) if (!flags.includes(flag)) flags.push(flag);
  if (inputChanged && !flags.includes(INPUT_CHANGED_FLAG)) flags.push(INPUT_CHANGED_FLAG);

  let workflowStatus = current.workflow_status;
  if (inputChanged) {
    workflowStatus = current.workflow_status === "approved" || current.workflow_status === "stale" ? "stale" : "pending";
  }

  const set = {
    "input.fingerprint": result.fingerprint,
    dates: {
      event_date: result.eventDate,
      article_created_at: result.articleCreatedAt,
      article_updated_at: result.articleUpdatedAt,
    },
    flags,
    relations,
    workflow_status: workflowStatus,
  };

  const changed =
    current.input.fingerprint !== result.fingerprint ||
    !sameTime(current.dates.event_date, result.eventDate) ||
    !sameTime(current.dates.article_created_at, result.articleCreatedAt) ||
    !sameTime(current.dates.article_updated_at, result.articleUpdatedAt) ||
    JSON.stringify(current.flags) !== JSON.stringify(flags) ||
    JSON.stringify(current.relations.map(normalizeRelation)) !== JSON.stringify(relations.map(normalizeRelation)) ||
    current.workflow_status !== workflowStatus;

  return { changed, inputChanged, set };
}

function normalizeRelation(relation: IsitRelation) {
  return {
    type: relation.type,
    news_id: relation.news_id === null ? null : String(relation.news_id),
    article_id: relation.article_id,
    confirmed: relation.confirmed,
  };
}
