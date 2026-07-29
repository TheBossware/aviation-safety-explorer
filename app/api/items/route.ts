import { NextResponse } from "next/server";
import { fetchItems } from "@/lib/api";

// Always run this route at request time (never statically generate at build).
export const dynamic = "force-dynamic";

/**
 * GET /api/items
 * Server-side proxy that fetches from n8n (when configured) and always
 * returns mapped items, falling back to mock data. This keeps the browser
 * from ever calling n8n directly (avoids CORS issues).
 */
export async function GET() {
  const { items, isLive, lastUpdated } = await fetchItems();
  return NextResponse.json(
    { items, isLive, lastUpdated, count: items.length },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}
