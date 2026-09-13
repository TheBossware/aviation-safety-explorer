import type { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId | string;
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/** User shape safe to send to the client: never includes the password hash. */
export type PublicUser = Omit<User, "password">;

export type CreateUserInput = Omit<User, "_id" | "createdAt" | "updatedAt">;
export type UpdateUserInput = Partial<Omit<CreateUserInput, "password">>;
