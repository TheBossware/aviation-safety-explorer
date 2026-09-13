import type { ObjectId } from "mongodb";

export interface Fleet {
  _id: ObjectId | string;
  typeCode: string;
  typeName: string;
  manufacturer: string;
  aircraftCount: number;
  totalEngines: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CreateFleetInput = Omit<Fleet, "_id" | "createdAt" | "updatedAt">;
export type UpdateFleetInput = Partial<CreateFleetInput>;
