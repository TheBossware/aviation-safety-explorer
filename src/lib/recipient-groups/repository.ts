import { dbConnect } from "@/lib/mongodb";
import { RecipientGroupModel } from "./model";
import type {
  CreateRecipientGroupInput,
  RecipientGroup,
  UpdateRecipientGroupInput,
} from "./types";

export async function findAll(
  filter: Partial<RecipientGroup> = {}
): Promise<RecipientGroup[]> {
  await dbConnect();
  return RecipientGroupModel.find(filter).sort({ groupName: 1 }).lean<RecipientGroup[]>();
}

export async function findById(id: string): Promise<RecipientGroup | null> {
  await dbConnect();
  return RecipientGroupModel.findById(id).lean<RecipientGroup>();
}

export async function create(input: CreateRecipientGroupInput): Promise<RecipientGroup> {
  await dbConnect();
  const doc = await RecipientGroupModel.create(input);
  return doc.toObject() as RecipientGroup;
}

export async function update(
  id: string,
  input: UpdateRecipientGroupInput
): Promise<RecipientGroup | null> {
  await dbConnect();
  return RecipientGroupModel.findByIdAndUpdate(id, input, { new: true }).lean<RecipientGroup>();
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await RecipientGroupModel.findByIdAndDelete(id);
  return res !== null;
}

export async function count(filter: Partial<RecipientGroup> = {}): Promise<number> {
  await dbConnect();
  return RecipientGroupModel.countDocuments(filter);
}
