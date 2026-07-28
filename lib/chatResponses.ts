import { items, sources, categoryCoverage } from "./data";

export interface Suggestion {
  title: string;
  subtitle: string;
  prompt: string;
}

export const suggestedPrompts: Suggestion[] = [
  {
    title: "Summarise critical alerts",
    subtitle: "What are the most urgent safety alerts right now?",
    prompt: "What are the most critical safety alerts right now?",
  },
  {
    title: "Airworthiness directives",
    subtitle: "Show recent ADs affecting the A320 and 737 MAX",
    prompt: "Show me recent airworthiness directives affecting the A320 and 737 MAX.",
  },
  {
    title: "Runway safety",
    subtitle: "What guidance exists on runway excursion prevention?",
    prompt: "What guidance exists on runway excursion prevention?",
  },
  {
    title: "Source coverage",
    subtitle: "Which categories have the most monitored sources?",
    prompt: "Which safety categories have the most monitored sources?",
  },
  {
    title: "CFIT prevention",
    subtitle: "Summarise the latest CFIT and TAWS guidance",
    prompt: "Summarise the latest CFIT and TAWS prevention guidance.",
  },
  {
    title: "TCAS compliance",
    subtitle: "What are the rules on responding to TCAS RAs?",
    prompt: "What are the rules on responding to TCAS resolution advisories?",
  },
];

function citations(names: string[]): string {
  const lines = names
    .map((n) => sources.find((s) => s.name === n) ?? items.find((it) => it.source === n))
    .filter(Boolean)
    .map((s) => `- **${(s as { name?: string; source?: string }).name ?? (s as { source?: string }).source}**`);
  return lines.length ? `\n\n**Sources**\n${lines.join("\n")}` : "";
}

/** Returns a mock, markdown-formatted answer grounded in the mock dataset. */
export function generateResponse(prompt: string): string {
  const q = prompt.toLowerCase();

  if (q.includes("critical") || q.includes("urgent") || (q.includes("alert") && !q.includes("tcas"))) {
    const alerts = items.filter((i) => i.type === "Alert").slice(0, 3);
    const table = [
      "| Severity | Title | Source |",
      "| --- | --- | --- |",
      ...alerts.map((a) => `| ${a.severity} | ${a.title.slice(0, 46)}… | ${a.source} |`),
    ].join("\n");
    return (
      `Here are the **most urgent safety alerts** currently tracked across your monitored sources.\n\n` +
      `## Top active alerts\n${table}\n\n` +
      `The **ICAO runway safety State Letter** is the highest-priority item — it is flagged **CRITICAL** following a measurable rise in runway excursion events, and asks states to accelerate Global Reporting Format (GRF) adoption.\n\n` +
      `The **FAA SAFO on TAWS nuisance alerts** is a close second, warning that repeated false activations may lead crews to distrust a key defence against controlled flight into terrain.` +
      citations(["ICAO", "FAA SAFO", "EUROCONTROL"])
    );
  }

  if (q.includes("airworthiness") || q.includes("directive") || q.includes("a320") || q.includes("737")) {
    const ad = items.find((i) => i.id === "3");
    const sb = items.find((i) => i.id === "5");
    return (
      `Two recent items are directly relevant to the **A320 family** and **737 MAX**.\n\n` +
      `## A320 family\n` +
      `- **${ad?.title}** — mandates a flight control computer software update to address an angle-of-attack processing anomaly. Until compliance, operators must apply the interim procedure in the associated AOT.\n\n` +
      `## 737 MAX\n` +
      `- **${sb?.title}** — a Boeing service bulletin recommending inspection and, where needed, rerouting of a wire bundle to preserve electrical separation. The FAA may follow with a mandatory AD.\n\n` +
      `Would you like the full compliance intervals for either item?` +
      citations(["EASA AD", "Boeing", "FAA"])
    );
  }

  if (q.includes("runway") || q.includes("excursion")) {
    const it = items.find((i) => i.id === "1");
    return (
      `**Runway excursion prevention** is currently the highest-profile topic in your feed.\n\n` +
      `The **${it?.source} State Letter** urges states to:\n` +
      `- Adopt the **Global Reporting Format (GRF)** for runway surface condition reporting\n` +
      `- Integrate excursion risk into **State Safety Programmes (SSP)** and **SMS**\n` +
      `- Reinforce **stabilised approach** monitoring and landing-performance training in degraded braking conditions\n\n` +
      `States are asked to report implementation status through the USOAP Continuous Monitoring Approach.` +
      citations(["ICAO", "SKYbrary", "Flight Safety Foundation"])
    );
  }

  if (q.includes("cfit") || q.includes("taws") || q.includes("terrain")) {
    return (
      `Here is a summary of the latest **CFIT / TAWS** guidance.\n\n` +
      `## SKYbrary CFIT toolkit\n` +
      `SKYbrary has refreshed its Controlled Flight Into Terrain knowledge area, consolidating ICAO, EUROCONTROL and Flight Safety Foundation guidance on:\n` +
      `- Terrain awareness and warning system (TAWS) use\n` +
      `- Stabilised approach criteria\n` +
      `- Human-factors elements behind loss of terrain awareness\n\n` +
      `## FAA SAFO on nuisance alerts\n` +
      `The FAA warns that repeated **TAWS nuisance alerts** on certain RNP and circling approaches may erode crew trust — crews must always fly the published escape manoeuvre for genuine warnings.` +
      citations(["SKYbrary", "FAA SAFO"])
    );
  }

  if (q.includes("tcas") || q.includes("resolution advisory")) {
    return (
      `**TCAS Resolution Advisory (RA) compliance** — key principles from the latest EUROCONTROL safety reminder:\n\n` +
      `- Once an RA triggers, the crew must **follow it promptly and accurately**\n` +
      `- The RA takes **priority over any ATC clearance** that conflicts with it\n` +
      `- The crew must **report the RA to ATC** as soon as practicable\n` +
      `- Operators should reinforce RA response in **recurrent training** and submit RA data for network monitoring\n\n` +
      `This follows occurrences where crews delayed or did not follow RAs.` +
      citations(["EUROCONTROL", "NASA ASRS"])
    );
  }

  if (q.includes("categor") || q.includes("coverage") || q.includes("source")) {
    const top = categoryCoverage.slice(0, 5);
    const table = [
      "| Category | Sources |",
      "| --- | --- |",
      ...top.map((c) => `| ${c.category} | ${c.count} |`),
    ].join("\n");
    return (
      `You are currently monitoring **${sources.length} sources** across **19 categories**. The best-covered categories are:\n\n` +
      `${table}\n\n` +
      `**Regulators** and **Accident Investigation** are the deepest categories, giving strong primary-source coverage. Categories such as **Flight Data Monitoring** and **Cyber Security** are lighter and could be expanded.` +
      citations(["ICAO", "NTSB", "Aviation Safety Network"])
    );
  }

  // Generic fallback
  const sample = items.slice(0, 3);
  return (
    `Here is what I found across your monitored aviation safety sources.\n\n` +
    `Your feed currently tracks **${items.length} recent items** from **${sources.length} sources**. Recent highlights include:\n` +
    sample.map((s) => `- **${s.title}** (${s.source}, ${s.severity})`).join("\n") +
    `\n\nAsk me about **airworthiness directives**, **runway safety**, **CFIT/TAWS**, **TCAS**, or **source coverage** for a more detailed breakdown.` +
    citations([sample[0].source, sample[1].source])
  );
}
