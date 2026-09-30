import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SourceActivity, WeeklySeverityRow } from "@/lib/aviation-news/types";
import type { DashboardClassification } from "@/lib/isit-classification/repository";
import type { IsitCodeAssignment } from "@/lib/isit-classification/types";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import type { IsitDimension } from "@/lib/isit-taxonomy/types";
import type { Severity } from "@/lib/shared/types";
import type { Source } from "@/lib/sources/types";
import { latestFetch, sourceOverview, summarizeIsit, topAirlines, weekStart, zeroFilledWeeks } from "./aggregations";

const EMPTY_WEEK = { INFO: 0, LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

describe("weekStart", () => {
  it("returns Monday 00:00 UTC of the week", () => {
    const monday = new Date("2026-09-28T00:00:00Z");
    assert.deepEqual(weekStart(new Date("2026-09-30T15:00:00Z")), monday); // Wednesday
    assert.deepEqual(weekStart(monday), monday);
    assert.deepEqual(weekStart(new Date("2026-10-04T23:59:00Z")), monday); // Sunday night
  });
});

describe("zeroFilledWeeks", () => {
  const firstWeek = new Date("2026-09-07T00:00:00Z");

  it("has one zeroed point per week, including weeks without rows", () => {
    assert.deepEqual(zeroFilledWeeks(firstWeek, 3, []), [
      { week: "2026-09-07", ...EMPTY_WEEK },
      { week: "2026-09-14", ...EMPTY_WEEK },
      { week: "2026-09-21", ...EMPTY_WEEK },
    ]);
  });

  it("adds rows to their week and ignores rows outside the range or with an unknown severity", () => {
    const rows: WeeklySeverityRow[] = [
      { week: "2026-09-14", severity: "HIGH", count: 2 },
      { week: "2026-09-14", severity: "LOW", count: 1 },
      { week: "2026-08-31", severity: "HIGH", count: 9 }, // before the range
      { week: "2026-09-21", severity: "BOGUS" as Severity, count: 5 },
    ];
    assert.deepEqual(zeroFilledWeeks(firstWeek, 3, rows), [
      { week: "2026-09-07", ...EMPTY_WEEK },
      { week: "2026-09-14", ...EMPTY_WEEK, HIGH: 2, LOW: 1 },
      { week: "2026-09-21", ...EMPTY_WEEK },
    ]);
  });
});

function activity(sourceId: string, lastFetchedAt: Date | null): SourceActivity {
  return { sourceId, source: sourceId.toUpperCase(), total: 3, bySeverity: { LOW: 3 }, lastFetchedAt, lastPublishedAt: null };
}

function source(id: string, name: string): Source {
  return { _id: id, id, name, type: "rss", url: `https://${id}.example`, active: true, category: "news" };
}

describe("latestFetch", () => {
  it("is null without any delivery", () => {
    assert.equal(latestFetch([]), null);
    assert.equal(latestFetch([activity("a", null)]), null);
  });

  it("is the latest delivery over all sources", () => {
    const latest = new Date("2026-09-30T04:00:00Z");
    const rows = [activity("a", new Date("2026-09-24T00:00:00Z")), activity("b", null), activity("c", latest)];
    assert.deepEqual(latestFetch(rows), latest);
  });
});

describe("sourceOverview", () => {
  it("appends active sources that never delivered as empty rows and names them as silent", () => {
    const rows = [activity("avherald", new Date("2026-09-30T00:00:00Z"))];
    const overview = sourceOverview(rows, [source("avherald", "AvHerald"), source("faa", "FAA News")]);
    assert.deepEqual(overview, {
      rows: [
        rows[0],
        { sourceId: "faa", source: "FAA News", total: 0, bySeverity: {}, lastFetchedAt: null, lastPublishedAt: null },
      ],
      activeCount: 2,
      silent: ["FAA News"],
    });
  });

  it("keeps inactive sources that have items, without counting them as active", () => {
    const overview = sourceOverview([activity("old", null)], []);
    assert.equal(overview.rows.length, 1);
    assert.equal(overview.activeCount, 0);
    assert.deepEqual(overview.silent, []);
  });
});

describe("topAirlines", () => {
  it("orders by mentions, ties alphabetically, and keeps the top N", () => {
    const airlines = [
      { name: "Ryanair", count: 3 },
      { name: "easyJet", count: 5 },
      { name: "Delta", count: 3 },
      { name: "KLM", count: 1 },
    ];
    assert.deepEqual(topAirlines(airlines, 3), [
      { key: "easyJet", label: "easyJet", count: 5 },
      { key: "Delta", label: "Delta", count: 3 },
      { key: "Ryanair", label: "Ryanair", count: 3 },
    ]);
    assert.equal(airlines[0].name, "Ryanair", "input is not reordered");
  });
});

describe("summarizeIsit", () => {
  const taxonomy = loadIsitTaxonomy();
  const code = (value: string, dimension: IsitDimension): IsitCodeAssignment => ({
    code: value,
    dimension,
    label: `label ${value}`,
    evidence_quote: null,
    rationale: null,
  });

  const records: DashboardClassification[] = [
    {
      // Approved: the reviewer's codes count, not the AI's.
      workflow_status: "approved",
      flags: ["late_report"],
      ai: { suggestion_id: "s1", outcome: "classified", codes: [code("10010101", "event")], created_at: "2026-09-01" },
      final: {
        outcome: "classified",
        codes: [code("60460202", "event"), code("40090200", "context")],
        taxonomy_version: "0.3.12",
        approved_by: "reviewer",
        approved_at: "2026-09-02",
        note: null,
      },
    },
    {
      workflow_status: "ai_suggested",
      flags: ["low_confidence", "late_report"],
      ai: {
        suggestion_id: "s2",
        outcome: "classified",
        codes: [
          code("60050206", "event"),
          code("70010600", "event"),
          code("40010200", "context"),
          code("50030303", "contributing"),
        ],
        created_at: "2026-09-03",
      },
      final: null,
    },
    { workflow_status: "pending", flags: [], ai: null, final: null },
  ];

  it("counts status, current outcome and flags", () => {
    const summary = summarizeIsit(records, taxonomy, 8);
    assert.equal(summary.total, 3);
    assert.deepEqual(summary.status, { approved: 1, ai_suggested: 1, pending: 1 });
    assert.deepEqual(summary.outcomes, { classified: 2 });
    assert.deepEqual(summary.flags, [
      { key: "late_report", label: "late_report", count: 2, hint: undefined },
      { key: "low_confidence", label: "low_confidence", count: 1, hint: undefined },
    ]);
  });

  it("counts each record once per ISIT group of its event codes", () => {
    assert.deepEqual(summarizeIsit(records, taxonomy, 8).groups, [
      { key: "60000000", label: "Engineering/Maintenance", count: 2, hint: undefined },
      { key: "70000000", label: "Flight Operations", count: 1, hint: undefined },
    ]);
  });

  it("names event codes from the taxonomy with their event type as hint, ignoring the AI codes of approved records", () => {
    assert.deepEqual(summarizeIsit(records, taxonomy, 8).eventCodes, [
      { key: "60460202", label: "Flight Deck Window Crack/Craze/Delam", count: 1, hint: "ATA 56 Windows" },
      { key: "70010600", label: "Flight Path Deviation", count: 1, hint: "Flight Path Management" },
      { key: "60050206", label: "UnCommanded lateral control", count: 1, hint: "ATA 22 Auto-Flight" },
    ]);
  });

  it("lists context codes with their parent as hint and leaves contributing codes out", () => {
    assert.deepEqual(summarizeIsit(records, taxonomy, 8).contextCodes, [
      { key: "40010200", label: "Departure", count: 1, hint: "Phase of Operation" },
      { key: "40090200", label: "Diversion", count: 1, hint: "Operational Impact" },
    ]);
  });

  it("keeps only the top N event and context codes", () => {
    const summary = summarizeIsit(records, taxonomy, 1);
    assert.equal(summary.eventCodes.length, 1);
    assert.equal(summary.contextCodes.length, 1);
    assert.equal(summary.groups.length, 2, "groups are not limited");
  });

  it("is empty for no records", () => {
    assert.deepEqual(summarizeIsit([], taxonomy, 8), {
      total: 0,
      status: {},
      outcomes: {},
      groups: [],
      eventCodes: [],
      contextCodes: [],
      flags: [],
    });
  });
});
