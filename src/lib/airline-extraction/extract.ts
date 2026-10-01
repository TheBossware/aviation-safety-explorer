import type { AirlineExtraction, AirlineMention, AirlineRole } from "@/lib/aviation-news/types";
import type { AirlineExtractionOutput } from "./llm/schemas";

/** Order of the flat `airlines` list: the operator first, then the airline it flew for. */
const ROLE_ORDER: AirlineRole[] = ["operator", "on_behalf_of", "subject"];

/**
 * Turns the model output into what is stored: names trimmed, empty names and repeated
 * name + role pairs dropped, roles sorted by ROLE_ORDER (stable within a role), and the flat
 * `airlines` list derived from them with each name once. No airlines gives empty lists, which
 * marks the item as checked.
 */
export function toExtraction(output: AirlineExtractionOutput, extractedBy: string): AirlineExtraction {
  const seen = new Set<string>();
  const roles: AirlineMention[] = [];
  for (const mention of output.mentions) {
    const name = mention.name.trim();
    const key = `${name.toLowerCase()}|${mention.role}`;
    if (!name || seen.has(key)) continue;
    seen.add(key);
    roles.push({ name, role: mention.role });
  }
  roles.sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));

  const airlines: string[] = [];
  for (const { name } of roles) {
    if (!airlines.some((existing) => existing.toLowerCase() === name.toLowerCase())) airlines.push(name);
  }
  return { airlines, roles, extractedBy };
}

/** Value of `airlines_extracted_by`: the model that answered and the prompt version. */
export function extractedByLabel(model: string, promptVersion: string): string {
  return `${model} (automatic, prompt ${promptVersion})`;
}
