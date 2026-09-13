import { dbConnect } from "@/lib/mongodb";
import { IsitTaxonomyModel } from "./model";
import type { CreateIsitTaxonomyInput, IsitTaxonomy, UpdateIsitTaxonomyInput } from "./types";

export async function findAll(filter: Partial<IsitTaxonomy> = {}): Promise<IsitTaxonomy[]> {
  await dbConnect();
  return IsitTaxonomyModel.find(filter).sort({ category: 1, subcategory: 1 }).lean<IsitTaxonomy[]>();
}

export async function findById(id: string): Promise<IsitTaxonomy | null> {
  await dbConnect();
  return IsitTaxonomyModel.findById(id).lean<IsitTaxonomy>();
}

export async function create(input: CreateIsitTaxonomyInput): Promise<IsitTaxonomy> {
  await dbConnect();
  const doc = await IsitTaxonomyModel.create(input);
  return doc.toObject() as IsitTaxonomy;
}

export async function update(
  id: string,
  input: UpdateIsitTaxonomyInput
): Promise<IsitTaxonomy | null> {
  await dbConnect();
  return IsitTaxonomyModel.findByIdAndUpdate(id, input, { new: true }).lean<IsitTaxonomy>();
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await IsitTaxonomyModel.findByIdAndDelete(id);
  return res !== null;
}

export async function count(filter: Partial<IsitTaxonomy> = {}): Promise<number> {
  await dbConnect();
  return IsitTaxonomyModel.countDocuments(filter);
}
