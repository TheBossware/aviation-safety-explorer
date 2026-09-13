import type { ObjectId } from "mongodb";
import type { Severity } from "@/lib/shared/types";

export interface RecipientGroup {
  _id: ObjectId | string;
  groupId: string;
  groupName: string;
  sources: (ObjectId | string)[];
  minSeverity: Severity;
  recipients: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CreateRecipientGroupInput = Omit<RecipientGroup, "_id" | "createdAt" | "updatedAt">;
export type UpdateRecipientGroupInput = Partial<CreateRecipientGroupInput>;
