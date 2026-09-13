import { dbConnect } from "@/lib/mongodb";
import { NetworkModel } from "./model";
import type { CreateNetworkAirportInput, NetworkAirport, UpdateNetworkAirportInput } from "./types";

export async function findAll(filter: Partial<NetworkAirport> = {}): Promise<NetworkAirport[]> {
  await dbConnect();
  return NetworkModel.find(filter).sort({ airportCode: 1 }).lean<NetworkAirport[]>();
}

export async function findById(id: string): Promise<NetworkAirport | null> {
  await dbConnect();
  return NetworkModel.findById(id).lean<NetworkAirport>();
}

export async function create(input: CreateNetworkAirportInput): Promise<NetworkAirport> {
  await dbConnect();
  const doc = await NetworkModel.create(input);
  return doc.toObject() as NetworkAirport;
}

export async function update(
  id: string,
  input: UpdateNetworkAirportInput
): Promise<NetworkAirport | null> {
  await dbConnect();
  return NetworkModel.findByIdAndUpdate(id, input, { new: true }).lean<NetworkAirport>();
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await NetworkModel.findByIdAndDelete(id);
  return res !== null;
}

export async function count(filter: Partial<NetworkAirport> = {}): Promise<number> {
  await dbConnect();
  return NetworkModel.countDocuments(filter);
}
