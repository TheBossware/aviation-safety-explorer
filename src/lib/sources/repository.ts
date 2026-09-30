import { dbConnect } from "@/lib/mongodb";
import { SourceModel } from "./model";
import type { CreateSourceInput, Source, UpdateSourceInput } from "./types";

/**
 * `.lean()` still returns a Mongoose ObjectId instance for `_id`, which
 * React Server Components refuse to pass to Client Components (only plain
 * JSON-serializable values are allowed). Normalize it to a string here so
 * every caller gets a plain `Source`.
 */
function serialize(doc: Source): Source {
  return { ...doc, _id: String(doc._id) };
}

/** Every source, active or not, by name. */
export async function findAll(): Promise<Source[]> {
  await dbConnect();
  const docs = await SourceModel.find({}).sort({ name: 1 }).lean<Source[]>();
  return docs.map(serialize);
}

/** Sources n8n currently polls, by name. */
export async function findActive(): Promise<Source[]> {
  await dbConnect();
  const docs = await SourceModel.find({ active: true }).sort({ name: 1 }).lean<Source[]>();
  return docs.map(serialize);
}

export async function create(input: CreateSourceInput): Promise<Source> {
  await dbConnect();
  const doc = await SourceModel.create(input);
  return serialize(doc.toObject() as Source);
}

export async function update(id: string, input: UpdateSourceInput): Promise<Source | null> {
  await dbConnect();
  const doc = await SourceModel.findByIdAndUpdate(id, input, { new: true }).lean<Source>();
  return doc ? serialize(doc) : null;
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await SourceModel.findByIdAndDelete(id);
  return res !== null;
}
