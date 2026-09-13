/** Shape of Next.js's resolved `searchParams` (each key can repeat, e.g. `?severity=A&severity=B`). */
export type SearchParams = Record<string, string | string[] | undefined>;

export function toSingle(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** Query string for the current filters with one field overridden; clears `page` and drops `"All"`. */
export function withParam(current: SearchParams, key: string, value: string): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (k === key || k === "page" || v === undefined) continue;
    toArray(v).forEach((item) => params.append(k, item));
  }
  if (value && value !== "All") params.set(key, value);
  return params.toString();
}

/** Query string for the current filters with `page` overridden. */
export function withPage(current: SearchParams, page: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    if (k === "page" || v === undefined) continue;
    toArray(v).forEach((item) => params.append(k, item));
  }
  params.set("page", String(page));
  return params.toString();
}
