import { ISIT_SOURCE_HOST } from "./types";

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
