import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import { formatDate, formatDateUtc } from "./format-date";

const ORIGINAL_TZ = process.env.TZ;
after(() => {
  process.env.TZ = ORIGINAL_TZ;
});

const SAMPLES: Array<[Date | string, string]> = [
  [new Date("2026-09-30T09:30:00Z"), "Sep 30, 2026"],
  ["2026-07-04T18:05:00.000Z", "Jul 4, 2026"], // ISO string input
  [new Date("2026-03-29T01:30:00Z"), "Mar 29, 2026"], // European DST switch
];

describe("formatDateUtc", () => {
  it("prints the UTC day whatever the server time zone", () => {
    for (const timeZone of ["UTC", "Europe/Istanbul", "America/Los_Angeles"]) {
      process.env.TZ = timeZone;
      for (const [value, expected] of SAMPLES) assert.equal(formatDateUtc(value), expected, `${timeZone} ${String(value)}`);
      assert.equal(formatDateUtc(new Date("2026-01-01T00:00:00Z")), "Jan 1, 2026", timeZone);
      assert.equal(formatDateUtc(new Date("2026-12-31T23:59:00Z")), "Dec 31, 2026", timeZone);
    }
  });
});

describe("formatDate", () => {
  it("prints the day in the local time zone", () => {
    process.env.TZ = "UTC";
    for (const [value, expected] of SAMPLES) assert.equal(formatDate(value), expected, String(value));
  });

  it("follows the local time zone around midnight UTC", () => {
    const newYear = new Date("2026-01-01T00:00:00Z");
    process.env.TZ = "UTC";
    assert.equal(formatDate(newYear), "Jan 1, 2026");
    process.env.TZ = "America/Los_Angeles";
    assert.equal(formatDate(newYear), "Dec 31, 2025");
    const lateEvening = new Date("2026-12-31T23:59:00Z");
    process.env.TZ = "Europe/Istanbul";
    assert.equal(formatDate(lateEvening), "Jan 1, 2027");
  });
});
