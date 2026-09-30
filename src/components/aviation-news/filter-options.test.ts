import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Source } from "@/lib/sources/types";
import {
  airlineOptions,
  categoryOptions,
  DATE_RANGE_OPTIONS,
  selectLabel,
  severityOptions,
  SORT_OPTIONS,
  sourceOptions,
} from "./filter-options";

const SOURCE: Source = { _id: "1", id: "avherald", name: "AvHerald", type: "rss", url: "https://avherald.com", active: true, category: "news" };

describe("filter options", () => {
  it("start with the 'All' option, then one option per choice", () => {
    assert.deepEqual(categoryOptions(["Incident", "Accident"]), [
      { value: "All", label: "All Categories" },
      { value: "Incident", label: "Incident" },
      { value: "Accident", label: "Accident" },
    ]);
    assert.deepEqual(sourceOptions([SOURCE]), [
      { value: "All", label: "All Sources" },
      { value: "avherald", label: "AvHerald" },
    ]);
    assert.deepEqual(
      severityOptions().map((o) => o.label),
      ["All Severities", "Info", "Low", "Medium", "High", "Critical"]
    );
  });

  it("show the mention count of an airline in the menu only", () => {
    assert.deepEqual(airlineOptions([{ name: "Ryanair", count: 5 }]), [
      { value: "All", label: "All Airlines" },
      { value: "Ryanair", label: "Ryanair (5)", selectedLabel: "Ryanair" },
    ]);
  });
});

describe("selectLabel (text on the closed Select)", () => {
  it("shows the placeholder while nothing is filtered", () => {
    const label = selectLabel("Categories", categoryOptions(["Incident"]));
    assert.equal(label("All"), "Categories");
    assert.equal(label(null), "Categories");
  });

  it("shows the chosen option's label, the short one when there is one", () => {
    assert.equal(selectLabel("Sources", sourceOptions([SOURCE]))("avherald"), "AvHerald");
    assert.equal(selectLabel("Airlines", airlineOptions([{ name: "Ryanair", count: 5 }]))("Ryanair"), "Ryanair");
    assert.equal(selectLabel("Severities", severityOptions())("HIGH"), "High");
    assert.equal(selectLabel("Date range", DATE_RANGE_OPTIONS)("30d"), "Last 30 days");
    assert.equal(selectLabel("Newest first", SORT_OPTIONS)("asc"), "Oldest first");
  });

  it("shows the raw value when it is not an option (e.g. an old link)", () => {
    assert.equal(selectLabel("Airlines", airlineOptions([]))("Pan Am"), "Pan Am");
  });
});
