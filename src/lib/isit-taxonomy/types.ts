import type { ObjectId } from "mongodb";

export interface IsitTaxonomy {
  _id: ObjectId | string;
  category: string;
  subcategory: string;
  description: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CreateIsitTaxonomyInput = Omit<IsitTaxonomy, "_id" | "createdAt" | "updatedAt">;
export type UpdateIsitTaxonomyInput = Partial<CreateIsitTaxonomyInput>;
