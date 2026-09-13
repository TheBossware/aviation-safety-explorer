import { dbConnect } from "@/lib/mongodb";
import { UserModel } from "./model";
import type { CreateUserInput, PublicUser, UpdateUserInput, User } from "./types";

/** Excludes `password` by default; the schema field is `select: false`. */
export async function findAll(filter: Partial<PublicUser> = {}): Promise<PublicUser[]> {
  await dbConnect();
  return UserModel.find(filter).sort({ name: 1 }).lean<PublicUser[]>();
}

export async function findById(id: string): Promise<PublicUser | null> {
  await dbConnect();
  return UserModel.findById(id).lean<PublicUser>();
}

/** Includes the password hash — only for auth flows that need to verify it. */
export async function findByEmailWithPassword(email: string): Promise<User | null> {
  await dbConnect();
  return UserModel.findOne({ email }).select("+password").lean<User>();
}

export async function create(input: CreateUserInput): Promise<PublicUser> {
  await dbConnect();
  const doc = await UserModel.create(input);
  const { password: _password, ...publicUser } = doc.toObject() as User;
  return publicUser;
}

export async function update(id: string, input: UpdateUserInput): Promise<PublicUser | null> {
  await dbConnect();
  return UserModel.findByIdAndUpdate(id, input, { new: true }).lean<PublicUser>();
}

export async function remove(id: string): Promise<boolean> {
  await dbConnect();
  const res = await UserModel.findByIdAndDelete(id);
  return res !== null;
}

export async function count(filter: Partial<PublicUser> = {}): Promise<number> {
  await dbConnect();
  return UserModel.countDocuments(filter);
}
