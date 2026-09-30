/**
 * The app's date display: day precision, en-US ("Sep 30, 2026"). `formatDate` uses the local time
 * zone of wherever it runs (for Server Components that is the server, not the viewer);
 * `formatDateUtc` is pinned to UTC. Callers decide what to show for a missing date.
 */

type DateInput = Date | string;

const DAY: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

/** "Sep 30, 2026" in the local time zone. */
export function formatDate(value: DateInput): string {
  return new Date(value).toLocaleDateString("en-US", DAY);
}

/** "Sep 30, 2026" in UTC. */
export function formatDateUtc(value: DateInput): string {
  return new Date(value).toLocaleDateString("en-US", { ...DAY, timeZone: "UTC" });
}
