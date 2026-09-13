import mongoose, { Schema, type Model } from "mongoose";
import { SEVERITY_VALUES } from "@/lib/shared/types";
import type { RecipientGroup } from "./types";

const RecipientGroupSchema = new Schema<RecipientGroup>(
  {
    groupId: { type: String, required: true, unique: true },
    groupName: { type: String, required: true },
    sources: [{ type: Schema.Types.ObjectId, ref: "Source" }],
    minSeverity: { type: String, enum: SEVERITY_VALUES, required: true, default: "INFO" },
    recipients: { type: [String], default: [] },
  },
  { timestamps: true, collection: "recipient_groups" }
);

export const RecipientGroupModel: Model<RecipientGroup> =
  (mongoose.models.RecipientGroup as Model<RecipientGroup>) ??
  mongoose.model<RecipientGroup>("RecipientGroup", RecipientGroupSchema);
