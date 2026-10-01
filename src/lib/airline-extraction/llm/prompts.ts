import type { AviationNews } from "@/lib/aviation-news/types";

/** Bump whenever the prompt text or schema changes; it is stored in `airlines_extracted_by`. */
export const AIRLINE_PROMPT_VERSION = "2026-10-01.1";

/**
 * Instructions plus the airline names already in the database, so the same airline keeps one
 * spelling. Stable between calls of a run: sent with a cache breakpoint.
 */
export function airlineSystem(knownNames: string[]): string {
  return `You extract the airlines an aviation news item is about. Sources are The Aviation Herald (AvHerald) occurrence reports and news from IATA, EASA, Airbus and Boeing.

Return every airline with one role:
- operator: operates the aircraft involved in an occurrence. Two aircraft of two airlines involved = two operators.
- on_behalf_of: the airline the operator flew for, when the text says so ("operated on behalf of Ryanair", "flight AA-5123 operated by PSA") or the operator is a regional/wet-lease carrier that only flies for that airline (Malta Air for Ryanair, Endeavor Air for Delta Air Lines, PSA Airlines and Piedmont Airlines for American Airlines).
- subject: for items that are not occurrences (orders, deliveries, new services, cabin or fleet upgrades, partnerships), the airline the item is about.

Rules:
- Only airlines (passenger, cargo, regional, charter). Never manufacturers, lessors, airports, regulators, investigation boards, IATA itself, air forces, private or business-jet owners.
- Use the airline's full common name, not the AvHerald short form: "PSA" -> "PSA Airlines", "Swiss" -> "Swiss International Air Lines", "ANZ" -> "Air New Zealand".
- If the airline is in the known list below, copy that spelling exactly. Otherwise use its usual English name.
- An airline only mentioned in passing (an earlier unrelated event, a codeshare list, a comparison) is not included.
- General news about the industry, regulation, events or the website itself names no airline: return an empty list. An empty list is a normal answer.
- List the operator first, then the airline it flew for.

Known airline names:
${knownNames.join("\n")}`;
}

export function airlineUser(news: Pick<AviationNews, "source_name" | "title" | "content">): string {
  return `SOURCE: ${news.source_name}
TITLE: ${news.title}

ARTICLE:
${news.content || "(no article text)"}`;
}
