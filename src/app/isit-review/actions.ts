"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import * as isitRepository from "@/lib/isit-classification/repository";
import { buildReview, REVIEWER_COOKIE } from "@/lib/isit-classification/review";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";

export interface ReviewFormState {
  error?: string;
  savedAt?: number;
}

export async function submitReviewAction(
  newsId: string,
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const record = await isitRepository.findByNewsId(newsId);
  if (!record) return { error: "Record not found." };

  const actor = String(formData.get("actor") ?? "");

  const result = buildReview(
    record,
    {
      actor,
      outcome: String(formData.get("outcome") ?? ""),
      codes: formData.getAll("codes").map(String),
      note: String(formData.get("note") ?? "") || null,
    },
    loadIsitTaxonomy()
  );
  if (!result.ok) return { error: result.error };

  const saved = await isitRepository.saveReview(newsId, result.final, result.events);
  if (!saved) return { error: "Failed to save the review. Please try again." };

  (await cookies()).set(REVIEWER_COOKIE, actor.trim(), { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
  revalidatePath("/isit-review");
  revalidatePath(`/isit-review/${newsId}`);
  return { savedAt: Date.now() };
}
