"use server";

import { revalidatePath } from "next/cache";

import { isObjectId } from "@/lib/shared/guards";
import * as sourcesRepository from "@/lib/sources/repository";
import { parseSourceForm } from "@/lib/sources/validation";

export interface SourceFormState {
  error?: string;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === 11000;
}

function revalidateSourcePages() {
  revalidatePath("/sources");
  revalidatePath("/");
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
    console.error("Creating source failed", err);
    return { error: "Failed to create source. Please try again." };
  }

  revalidateSourcePages();
  return {};
}

export async function updateSourceAction(
  mongoId: string,
  _prevState: SourceFormState,
  formData: FormData
): Promise<SourceFormState> {
  if (!isObjectId(mongoId)) return { error: "Source not found." };
  const parsed = parseSourceForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const updated = await sourcesRepository.update(mongoId, parsed.data);
    if (!updated) return { error: "Source not found." };
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return { error: `A source with ID "${parsed.data.id}" already exists.` };
    }
    console.error("Updating source failed", err);
    return { error: "Failed to update source. Please try again." };
  }

  revalidateSourcePages();
  return {};
}

export async function deleteSourceAction(mongoId: string): Promise<SourceFormState> {
  if (!isObjectId(mongoId)) return { error: "Source not found." };

  try {
    const removed = await sourcesRepository.remove(mongoId);
    if (!removed) return { error: "Source not found." };
  } catch (err) {
    console.error("Deleting source failed", err);
    return { error: "Failed to delete source. Please try again." };
  }

  revalidateSourcePages();
  return {};
}
