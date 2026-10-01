import { z } from "zod";

/** What the model returns. The flat airline list and `extractedBy` are filled in by code, not asked for. */

const AirlineMentionSchema = z.object({
  name: z.string(),
  role: z.enum(["operator", "on_behalf_of", "subject"]),
});

export const AirlineExtractionSchema = z.object({
  mentions: z.array(AirlineMentionSchema),
});
export type AirlineExtractionOutput = z.infer<typeof AirlineExtractionSchema>;
