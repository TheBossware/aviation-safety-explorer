import { NextResponse } from "next/server";
import { fetchItemById } from "@/lib/api";

export const revalidate = 60;

/**
 * GET /api/items/[id]
 * Returns a single item by ID from the (cached) data set, falling back to
 * mock data when n8n is not configured.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await fetchItemById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    { item },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
