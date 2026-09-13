import mongoose, { Schema, type Model } from "mongoose";
import type { User } from "./types";

const UserSchema = new Schema<User>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "users" }
);

export const UserModel: Model<User> =
  (mongoose.models.User as Model<User>) ?? mongoose.model<User>("User", UserSchema);
