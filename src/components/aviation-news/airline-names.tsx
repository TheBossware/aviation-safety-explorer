import Link from "next/link";

import type { AirlineMention, AviationNews } from "@/lib/aviation-news/types";

/** Roles when present; items that only have the flat list are shown without a relationship. */
function mentionsOf(item: Pick<AviationNews, "airlines" | "airline_roles">): AirlineMention[] {
  if (item.airline_roles?.length) return item.airline_roles;
  return (item.airlines ?? []).map((name) => ({ name, role: "subject" }));
}

/**
 * "Malta Air, on behalf of Ryanair" / "Virgin Australia · Qantas" / "Turkish Airlines".
 * With `linked`, each airline links to the news list filtered by it.
 */
export function AirlineNames({
  item,
  linked = false,
}: {
  item: Pick<AviationNews, "airlines" | "airline_roles">;
  linked?: boolean;
}) {
  const mentions = mentionsOf(item);
  if (!mentions.length) return null;

  const name = (airline: string) =>
    linked ? (
      <Link key={airline} href={`/aviation-news?airline=${encodeURIComponent(airline)}`} className="hover:underline">
        {airline}
      </Link>
    ) : (
      <span key={airline}>{airline}</span>
    );

  const joined = (names: string[]) =>
    names.flatMap((airline, i) => (i === 0 ? [name(airline)] : [<span key={`sep-${i}`} className="text-muted-foreground"> · </span>, name(airline)]));

  const principal = mentions.filter((m) => m.role !== "on_behalf_of").map((m) => m.name);
  const forAirlines = mentions.filter((m) => m.role === "on_behalf_of").map((m) => m.name);

  return (
    <span>
      {joined(principal)}
      {forAirlines.length > 0 && (
        <>
          <span className="font-normal text-muted-foreground">, on behalf of </span>
          {joined(forAirlines)}
        </>
      )}
    </span>
  );
}
