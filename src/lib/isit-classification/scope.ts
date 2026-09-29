import type { AviationNews } from "@/lib/aviation-news/types";
import { ISIT_SOURCE_HOST, ISIT_SOURCE_ID } from "./types";

export type ScopeDecision = { inScope: true; articleId: string } | { inScope: false; reason: string };

/** AvHerald article id from `https://avherald.com/h?article=<hex>`, or null. */
export function articleIdFromUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, "");
  const id = parsed.searchParams.get("article");
  return host === ISIT_SOURCE_HOST && id && /^[0-9a-f]+$/i.test(id) ? id.toLowerCase() : null;
}

/**
 * Only AvHerald items enter the pipeline. `source_id` decides (it is the key n8n dedups on;
 * `source_name` is display text), and the URL must point at an AvHerald article so that a
 * mislabeled item cannot slip in.
 */
export function decideScope(news: Pick<AviationNews, "source_id" | "url">): ScopeDecision {
  if (news.source_id !== ISIT_SOURCE_ID) {
    return { inScope: false, reason: `source_id is "${news.source_id}"` };
  }
  const articleId = articleIdFromUrl(news.url ?? "");
  if (!articleId) {
    return { inScope: false, reason: `url is not an AvHerald article: "${news.url}"` };
  }
  return { inScope: true, articleId };
}
