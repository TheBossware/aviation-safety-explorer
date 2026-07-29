import {
  items as mockItems,
  stats as mockStats,
  topSources as mockTopSources,
  categoryCoverage as mockCategoryCoverage,
  categoryColor,
  ContentItem,
  ItemType,
  Severity,
} from "./data";

// ---------------------------------------------------------------------------
// Types returned by the n8n JSON API (webhook: /webhook/aviation-dashboard)
// ---------------------------------------------------------------------------
export interface ApiItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  publishedAt: string | null;
  fetchedAt?: string | null;
  category: string;
  tags: string[];
  sourceName: string;
  sourceId: string;
}

export interface ApiResponse {
  ok: boolean;
  generatedAt: string;
  lastItemDate: string | null;
  stats: { total: number; sources: number; adCount: number; categories: number };
  topSources: Array<{ name: string; count: number }>;
  categoryBreakdown: Array<{ name: string; count: number }>;
  items: ApiItem[];
}

// ---------------------------------------------------------------------------
// Shapes consumed by the UI
// ---------------------------------------------------------------------------
export interface DashboardData {
  isLive: boolean;
  lastUpdated: string | null;
  stats: typeof mockStats;
  recentItems: ContentItem[];
  topSources: Array<{ name: string; count: number; initials: string; color: string; category: string }>;
  categoryCoverage: Array<{ category: string; count: number }>;
}

export interface ItemsData {
  isLive: boolean;
  lastUpdated: string | null;
  items: ContentItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function getApiUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_N8N_API_URL;
  return url && url.trim() ? url.trim() : undefined;
}

function initialsOf(name: string): string {
  const clean = name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
  if (!clean[0]) return "?";
  if (clean.length === 1) return clean[0].slice(0, 2).toUpperCase();
  return (clean[0][0] + clean[1][0]).toUpperCase();
}

function toDateString(d: string | null | undefined): string {
  if (!d) return "2026-07-27";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "2026-07-27";
  return dt.toISOString().slice(0, 10);
}

/** Infer an internal item type from the API category / tags. */
function inferType(category: string, tags: string[]): ItemType {
  const c = (category || "").toLowerCase();
  const t = tags.map((x) => x.toLowerCase());
  if (c.includes("airworthiness") || t.includes("ad")) return "Advisory";
  if (c.includes("alert") || t.includes("alert")) return "Alert";
  if (c.includes("warning") || t.includes("warning")) return "Warning";
  if (c.includes("advisory")) return "Advisory";
  return "Report";
}

/** Infer a severity from category / tags. */
function inferSeverity(category: string, tags: string[]): Severity {
  const c = (category || "").toLowerCase();
  const t = tags.map((x) => x.toLowerCase());
  if (c.includes("airworthiness") || t.includes("ad")) return "HIGH";
  if (t.includes("critical")) return "CRITICAL";
  if (c.includes("alert") || t.includes("alert")) return "HIGH";
  if (c.includes("warning")) return "MEDIUM";
  return "INFO";
}

/** Map an n8n ApiItem into the internal ContentItem shape used by the UI. */
export function mapApiItem(a: ApiItem): ContentItem {
  const source = a.sourceName || a.sourceId || "Unknown Source";
  const category = a.category || "Aviation News";
  const type = inferType(category, a.tags || []);
  const severity = inferSeverity(category, a.tags || []);
  const content = (a.content || a.summary || "")
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    id: a.id,
    title: a.title || "(untitled)",
    source,
    sourceInitials: initialsOf(source),
    sourceColor: categoryColor(category),
    date: toDateString(a.publishedAt || a.fetchedAt),
    summary: a.summary || (a.content ? a.content.slice(0, 220) : ""),
    content: content.length ? content : [a.summary || "No further detail available."],
    severity,
    type,
    category,
    region: "Global",
    tags: (a.tags || []).slice(0, 6),
    // Preserve original external link for API-sourced items
    ...(a.url ? { url: a.url } : {}),
  } as ContentItem;
}

// ---------------------------------------------------------------------------
// Fetching (server-side)
// ---------------------------------------------------------------------------
async function fetchApiResponse(): Promise<ApiResponse | null> {
  const url = getApiUrl();
  if (!url) return null;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
      // Guard against a hanging webhook
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ApiResponse;
    if (!data || data.ok === false || !Array.isArray(data.items)) return null;
    return data;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — always resolves (falls back to mock data)
// ---------------------------------------------------------------------------
export async function fetchDashboardData(): Promise<DashboardData> {
  const api = await fetchApiResponse();

  if (!api) {
    return {
      isLive: false,
      lastUpdated: null,
      stats: mockStats,
      recentItems: mockItems.slice(0, 6),
      topSources: mockTopSources.slice(0, 10).map((s) => ({
        name: s.name,
        count: s.items,
        initials: s.initials,
        color: s.color,
        category: s.category,
      })),
      categoryCoverage: mockCategoryCoverage,
    };
  }

  const mapped = api.items.map(mapApiItem);

  // Build 4 stat cards from the live stats, preserving the dashboard visual system
  const liveStats = [
    { ...mockStats[0], label: "Total Items", value: String(api.stats.total), change: "live", sub: "in database" },
    { ...mockStats[1], label: "AD Count", value: String(api.stats.adCount), change: "tracked", sub: "airworthiness", trend: "up" },
    { ...mockStats[2], label: "Sources", value: String(api.stats.sources), change: "active", sub: "monitored" },
    { ...mockStats[3], label: "Categories", value: String(api.stats.categories), change: "covered", sub: "topics" },
  ] as typeof mockStats;

  const topSources = (api.topSources || []).slice(0, 10).map((s) => ({
    name: s.name,
    count: s.count,
    initials: initialsOf(s.name),
    color: categoryColor(s.name),
    category: s.name,
  }));

  const categoryCoverage = (api.categoryBreakdown || [])
    .map((c) => ({ category: c.name, count: c.count }))
    .sort((a, b) => b.count - a.count);

  return {
    isLive: true,
    lastUpdated: api.lastItemDate || api.generatedAt || null,
    stats: liveStats,
    recentItems: mapped.slice(0, 6),
    topSources: topSources.length ? topSources : mockTopSources.slice(0, 10).map((s) => ({
      name: s.name, count: s.items, initials: s.initials, color: s.color, category: s.category,
    })),
    categoryCoverage: categoryCoverage.length ? categoryCoverage : mockCategoryCoverage,
  };
}

export async function fetchItems(): Promise<ItemsData> {
  const api = await fetchApiResponse();
  if (!api) {
    return { isLive: false, lastUpdated: null, items: mockItems };
  }
  return {
    isLive: true,
    lastUpdated: api.lastItemDate || api.generatedAt || null,
    items: api.items.map(mapApiItem),
  };
}

export async function fetchItemById(id: string): Promise<ContentItem | null> {
  const { items } = await fetchItems();
  return items.find((i) => i.id === id) ?? null;
}
