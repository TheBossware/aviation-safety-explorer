import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ALL, DATE_RANGES, parseAviationNewsFilter } from "./filters";

/** Local time on purpose: the ranges are counted back in the server's local calendar. */
const NOW = new Date(2026, 8, 30, 12, 0); // Sep 30, 2026 12:00

describe("parseAviationNewsFilter", () => {
  it("returns no filters, newest first, page 1 for an empty URL", () => {
    assert.deepEqual(parseAviationNewsFilter({}, NOW), {
      category: undefined,
      severity: [],
      sourceId: undefined,
      publishedAfter: undefined,
      q: undefined,
      aircraft: undefined,
      tag: undefined,
      airline: undefined,
      sort: "desc",
      page: 1,
    });
  });

  it("passes the single-value filters through", () => {
    const filter = parseAviationNewsFilter(
      { category: "Incident", source: "avherald", airline: "Ryanair", q: "smoke", aircraft: "A320", tag: "diversion" },
      NOW
    );
    assert.equal(filter.category, "Incident");
    assert.equal(filter.sourceId, "avherald");
    assert.equal(filter.airline, "Ryanair");
    assert.equal(filter.q, "smoke");
    assert.equal(filter.aircraft, "A320");
    assert.equal(filter.tag, "diversion");
  });

  it("treats the Select 'All' sentinel as no filter for category, source, airline and range", () => {
    const filter = parseAviationNewsFilter({ category: "All", source: "All", airline: "All", range: "All" }, NOW);
    assert.equal(filter.category, undefined);
    assert.equal(filter.sourceId, undefined);
    assert.equal(filter.airline, undefined);
    assert.equal(filter.publishedAfter, undefined);
  });

  it("keeps 'All' in the free-text fields (only Selects use the sentinel)", () => {
    const filter = parseAviationNewsFilter({ q: "All", aircraft: "All", tag: "All" }, NOW);
    assert.equal(filter.q, "All");
    assert.equal(filter.aircraft, "All");
    assert.equal(filter.tag, "All");
  });

  it("takes the first value when a single-value param repeats", () => {
    assert.equal(parseAviationNewsFilter({ category: ["A", "B"] }, NOW).category, "A");
  });

  it("keeps every valid severity and drops unknown or lowercase ones", () => {
    assert.deepEqual(parseAviationNewsFilter({ severity: ["HIGH", "CRITICAL"] }, NOW).severity, ["HIGH", "CRITICAL"]);
    assert.deepEqual(parseAviationNewsFilter({ severity: "LOW" }, NOW).severity, ["LOW"]);
    assert.deepEqual(parseAviationNewsFilter({ severity: ["high", "BAD", "INFO"] }, NOW).severity, ["INFO"]);
  });

  it("sorts oldest first only for sort=asc", () => {
    assert.equal(parseAviationNewsFilter({ sort: "asc" }, NOW).sort, "asc");
    assert.equal(parseAviationNewsFilter({ sort: "desc" }, NOW).sort, "desc");
    assert.equal(parseAviationNewsFilter({ sort: "sideways" }, NOW).sort, "desc");
  });

  it("parses the page number, falling back to 1 for missing, zero or non-numeric values", () => {
    assert.equal(parseAviationNewsFilter({ page: "3" }, NOW).page, 3);
    assert.equal(parseAviationNewsFilter({ page: "abc" }, NOW).page, 1);
    assert.equal(parseAviationNewsFilter({ page: "0" }, NOW).page, 1);
    // Passed through as is; the repository treats page < 1 as page 1.
    assert.equal(parseAviationNewsFilter({ page: "-2" }, NOW).page, -2);
  });

  it("turns a date range into the start date, counted back from now", () => {
    const start = (range: string) => parseAviationNewsFilter({ range }, NOW).publishedAfter;
    assert.deepEqual(start("7d"), new Date(2026, 8, 23, 12, 0));
    assert.deepEqual(start("30d"), new Date(2026, 7, 31, 12, 0));
    assert.deepEqual(start("90d"), new Date(2026, 6, 2, 12, 0));
    assert.deepEqual(start("6m"), new Date(2026, 2, 30, 12, 0));
    assert.deepEqual(start("1y"), new Date(2025, 8, 30, 12, 0));
    assert.equal(start("2w"), undefined);
    assert.equal(start(""), undefined);
  });

  it("has a start date for every date range the filter menus offer", () => {
    for (const { value } of DATE_RANGES) {
      const start = parseAviationNewsFilter({ range: value }, NOW).publishedAfter;
      if (value === ALL) assert.equal(start, undefined);
      else assert.ok(start instanceof Date && start < NOW, `range ${value}`);
    }
  });

  it("uses plain calendar month math (Mar 31 minus 6 months overflows into October)", () => {
    const march31 = new Date(2026, 2, 31, 12, 0);
    assert.deepEqual(parseAviationNewsFilter({ range: "6m" }, march31).publishedAfter, new Date(2025, 9, 1, 12, 0));
  });

  it("does not modify the given now", () => {
    const now = new Date(NOW);
    parseAviationNewsFilter({ range: "7d" }, now);
    assert.deepEqual(now, NOW);
  });
});
