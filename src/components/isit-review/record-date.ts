import { formatDateUtc } from "@/lib/shared/format-date";

/** A date shown on the ISIT review page, in UTC; "—" when the record doesn't have it (yet). */
export function recordDate(value: Date | string | null | undefined): string {
  return value ? formatDateUtc(value) : "—";
}
