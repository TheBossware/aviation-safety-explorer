import { dbConnect } from "@/lib/mongodb";
import { FleetModel } from "./model";
import type { CreateFleetInput, Fleet, UpdateFleetInput } from "./types";

export async function findAll(filter: Partial<Fleet> = {}): Promise<Fleet[]> {
  await dbConnect();
  return FleetModel.find(filter).sort({ typeName: 1 }).lean<Fleet[]>();
}

export async function findById(id: string): Promise<Fleet | null> {
  await dbConnect();
  return FleetModel.findById(id).lean<Fleet>();
}

export async function create(input: CreateFleetInput): Promise<Fleet> {
  await dbConnect();
  const doc = await FleetModel.create(input);
  return doc.toObject() as Fleet;
}

export async function update(id: string, input: UpdateFleetInput): Promise<Fleet | null> {
  await dbConnect();
  return FleetModel.findByIdAndUpdate(id, input, { new: true }).lean<Fleet>();
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await FleetModel.findByIdAndDelete(id);
  return res !== null;
}

export async function count(filter: Partial<Fleet> = {}): Promise<number> {
  await dbConnect();
  return FleetModel.countDocuments(filter);
}
