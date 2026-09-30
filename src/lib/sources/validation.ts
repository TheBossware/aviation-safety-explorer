import { z } from "zod";

import { isOneOf } from "@/lib/shared/guards";
import { SOURCE_TYPE_VALUES, type CreateSourceInput, type SourceType } from "./types";

const requiredText = (message: string) => z.string().trim().min(1, message);

/** Field order is the order errors are reported in: the first problem is the one shown. */
const SourceFormSchema = z.object({
  id: requiredText("Source ID is required."),
  name: requiredText("Name is required."),
  type: z.custom<SourceType>((value) => isOneOf(SOURCE_TYPE_VALUES, value), "Select a valid source type."),
  url: requiredText("URL is required.").pipe(
    z.url({ protocol: /^https?$/, error: "Enter a valid http:// or https:// URL." })
  ),
  category: requiredText("Category is required."),
  active: z.boolean(),
});

/** Reads the add/edit source form: the source to store, or the first thing wrong with it. */
export function parseSourceForm(formData: FormData): { data: CreateSourceInput } | { error: string } {
  const text = (name: string) => String(formData.get(name) ?? "");
  const result = SourceFormSchema.safeParse({
    id: text("id"),
    name: text("name"),
    type: text("type"),
    url: text("url"),
    category: text("category"),
    active: formData.get("active") === "on",
  });
  return result.success ? { data: result.data } : { error: result.error.issues[0].message };
}
