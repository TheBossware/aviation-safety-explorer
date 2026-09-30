import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseSourceForm } from "./validation";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

const VALID = {
  id: "easa_news",
  name: "EASA News",
  type: "rss",
  url: "https://www.easa.europa.eu/newsroom-and-events/news/feed.xml",
  category: "regulator",
  active: "on",
};

describe("parseSourceForm", () => {
  it("returns the trimmed source, active only when the switch is on", () => {
    assert.deepEqual(parseSourceForm(form({ ...VALID, id: "  easa_news ", url: ` ${VALID.url} ` })), {
      data: { ...VALID, active: true },
    });
    const { id, name, type, url, category } = VALID; // no "active": switch off
    const inactive = { id, name, type, url, category };
    assert.deepEqual(parseSourceForm(form(inactive)), { data: { ...inactive, active: false } });
  });

  it("reports missing fields in form order, first one only", () => {
    assert.deepEqual(parseSourceForm(form({})), { error: "Source ID is required." });
    assert.deepEqual(parseSourceForm(form({ ...VALID, name: "  " })), { error: "Name is required." });
    assert.deepEqual(parseSourceForm(form({ ...VALID, url: "" })), { error: "URL is required." });
    assert.deepEqual(parseSourceForm(form({ ...VALID, category: "" })), { error: "Category is required." });
    assert.deepEqual(parseSourceForm(form({ ...VALID, name: "", url: "" })), { error: "Name is required." });
  });

  it("accepts only the known feed formats", () => {
    assert.equal("data" in parseSourceForm(form({ ...VALID, type: "json" })), true);
    for (const type of ["", "RSS", "atom"]) {
      assert.deepEqual(parseSourceForm(form({ ...VALID, type })), { error: "Select a valid source type." }, type);
    }
  });

  it("accepts only http and https URLs", () => {
    assert.equal("data" in parseSourceForm(form({ ...VALID, url: "http://example.com/feed" })), true);
    for (const url of ["example.com/feed", "ftp://example.com/feed", "javascript:alert(1)", "not a url"]) {
      assert.deepEqual(parseSourceForm(form({ ...VALID, url })), { error: "Enter a valid http:// or https:// URL." }, url);
    }
  });
});
