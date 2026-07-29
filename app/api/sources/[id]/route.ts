import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DB_NAME = "n8n";
const COLLECTION = "sources";

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection(COLLECTION);
}

function toObjectId(id: string): ObjectId | null {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/** PUT /api/sources/[id] — update an existing source. */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _id = toObjectId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const body = await req.json();

    // Only allow known fields to be updated.
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) update.name = String(body.name).trim();
    if (body.url !== undefined) update.url = String(body.url).trim();
    if (body.type !== undefined) update.type = String(body.type);
    if (body.selector !== undefined) update.selector = String(body.selector);
    if (body.category !== undefined) update.category = String(body.category);
    if (body.active !== undefined) update.active = Boolean(body.active);

    const col = await getCollection();
    const result = await col.findOneAndUpdate(
      { _id },
      { $set: update },
      { returnDocument: "after" }
    );
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ...result, _id: String(result._id) });
  } catch (err) {
    console.error("PUT /api/sources/[id] failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

/** DELETE /api/sources/[id] — remove a source. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _id = toObjectId(id);
    if (!_id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
    const col = await getCollection();
    const result = await col.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/sources/[id] failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}
