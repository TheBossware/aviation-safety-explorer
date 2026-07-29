import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const DB_NAME = "n8n"; // default database on the cluster
const COLLECTION = "sources";

interface SourceDoc {
  id: string;
  name: string;
  type: "rss" | "html" | "json" | "youtube";
  url: string;
  selector: string;
  active: boolean;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Seed data inserted only when the collection is empty.
const SEED: Array<Omit<SourceDoc, "createdAt" | "updatedAt">> = [
  { id: "avherald", name: "AVHerald", type: "html", url: "https://avherald.com", selector: "", active: true, category: "Accident Investigation" },
  { id: "faa", name: "FAA", type: "html", url: "https://www.faa.gov", selector: "", active: true, category: "Regulators" },
  { id: "easa", name: "EASA", type: "html", url: "https://www.easa.europa.eu", selector: "", active: true, category: "Regulators" },
  { id: "ntsb", name: "NTSB", type: "html", url: "https://www.ntsb.gov", selector: "", active: true, category: "Accident Investigation" },
  { id: "icao", name: "ICAO", type: "html", url: "https://www.icao.int", selector: "", active: true, category: "Regulators" },
  { id: "flight-safety-foundation", name: "Flight Safety Foundation", type: "html", url: "https://flightsafety.org", selector: "", active: true, category: "Safety Organisations" },
  { id: "aviation-safety-network", name: "Aviation Safety Network", type: "html", url: "https://aviation-safety.net", selector: "", active: true, category: "Occurrence Databases" },
  { id: "skybrary", name: "SKYbrary", type: "html", url: "https://skybrary.aero", selector: "", active: true, category: "Safety Organisations" },
  { id: "airbus-safety-first", name: "Airbus Safety First", type: "html", url: "https://safetyfirst.airbus.com", selector: "", active: true, category: "Aircraft Manufacturers" },
  { id: "simple-flying", name: "Simple Flying", type: "html", url: "https://simpleflying.com", selector: "", active: true, category: "Aviation News" },
  { id: "faa-news", name: "FAA Newsroom", type: "rss", url: "https://www.faa.gov/newsroom/rss", selector: "", active: true, category: "Safety Alerts" },
  { id: "easa-news", name: "EASA News", type: "rss", url: "https://www.easa.europa.eu/en/rss.xml", selector: "", active: true, category: "Regulators" },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(DB_NAME).collection<SourceDoc>(COLLECTION);
}

/** GET /api/sources — list all sources (seed if empty). */
export async function GET() {
  try {
    const col = await getCollection();
    const count = await col.countDocuments();
    if (count === 0) {
      const now = new Date();
      await col.insertMany(
        SEED.map((s) => ({ ...s, createdAt: now, updatedAt: now }))
      );
    }
    const docs = await col.find({}).sort({ name: 1 }).toArray();
    // Serialise _id to string
    const sources = docs.map((d) => ({ ...d, _id: String(d._id) }));
    return NextResponse.json(sources, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("GET /api/sources failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to load sources" },
      { status: 500 }
    );
  }
}

/** POST /api/sources — create a new source. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const url = String(body.url || "").trim();
    if (!name || !url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }
    const now = new Date();
    const doc: Omit<SourceDoc, "_id"> = {
      id: slugify(name),
      name,
      type: (body.type as SourceDoc["type"]) || "html",
      url,
      selector: String(body.selector || ""),
      active: body.active === undefined ? true : Boolean(body.active),
      category: String(body.category || "Aviation News"),
      createdAt: now,
      updatedAt: now,
    };
    const col = await getCollection();
    const result = await col.insertOne(doc as SourceDoc);
    return NextResponse.json(
      { ...doc, _id: String(result.insertedId) },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/sources failed:", (err as Error).message);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
