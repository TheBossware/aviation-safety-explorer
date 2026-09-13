"use server";

import { revalidatePath } from "next/cache";

import * as sourcesRepository from "@/lib/sources/repository";
import { SOURCE_TYPE_VALUES, type CreateSourceInput, type SourceType } from "@/lib/sources/types";

export interface SourceFormState {
  error?: string;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

function parseSourceForm(formData: FormData): { data: CreateSourceInput } | { error: string } {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const url = String(formData.get("url") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const active = formData.get("active") === "on";

  if (!id) return { error: "Source ID is required." };
  if (!name) return { error: "Name is required." };
  if (!SOURCE_TYPE_VALUES.includes(type as SourceType)) {
    return { error: "Select a valid source type." };
  }
  if (!url) return { error: "URL is required." };
  if (!category) return { error: "Category is required." };

  return { data: { id, name, type: type as SourceType, url, category, active } };
}

export async function createSourceAction(
  _prevState: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  const parsed = parseSourceForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    await sourcesRepository.create(parsed.data);
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { error: `A source with ID "${parsed.data.id}" already exists.` };
    }
    return { error: "Failed to create source. Please try again." };
  }

  revalidatePath("/sources");
  revalidatePath("/");
  return {};
}

export async function updateSourceAction(
  mongoId: string,
  _prevState: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  const parsed = parseSourceForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const updated = await sourcesRepository.update(mongoId, parsed.data);
    if (!updated) return { error: "Source not found." };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { error: `A source with ID "${parsed.data.id}" already exists.` };
    }
    return { error: "Failed to update source. Please try again." };
  }

  revalidatePath("/sources");
  revalidatePath("/");
  return {};
}

export async function deleteSourceAction(mongoId: string): Promise<void> {
  await sourcesRepository.remove(mongoId);
  revalidatePath("/sources");
  revalidatePath("/");
}
