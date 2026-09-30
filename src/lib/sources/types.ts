/** The feed format a source is polled as, e.g. an RSS feed vs. a JSON API. */
export type SourceType = "rss" | "json";

export const SOURCE_TYPE_VALUES: readonly SourceType[] = ["rss", "json"];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  rss: "RSS",
  json: "JSON",
};

/** A source as the app sees it (`_id` as a string). What MongoDB stores is `SourceDocument` in model.ts. */
export interface Source {
  _id: string;
  id: string;
  name: string;
  type: SourceType;
  url: string;
  active: boolean;
  category: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type CreateSourceInput = Omit<Source, "_id" | "createdAt" | "updatedAt">;
export type UpdateSourceInput = Partial<CreateSourceInput>;
