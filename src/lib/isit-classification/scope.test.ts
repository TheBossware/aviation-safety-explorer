import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { articleIdFromUrl } from "./scope";

describe("articleIdFromUrl", () => {
  it("extracts the article id", () => {
    assert.equal(articleIdFromUrl("https://avherald.com/h?article=529de372"), "529de372");
    assert.equal(articleIdFromUrl("https://www.avherald.com/h?article=53D51269&opt=0"), "53d51269");
  });

  it("rejects other hosts and malformed urls", () => {
    assert.equal(articleIdFromUrl("https://bsky.app/profile/avherald.com/post/3mse3vxinps2h"), null);
    assert.equal(articleIdFromUrl("https://avherald.com.evil.example/h?article=529de372"), null);
    assert.equal(articleIdFromUrl("https://avherald.com/h?article=not-hex"), null);
    assert.equal(articleIdFromUrl("not a url"), null);
    assert.equal(articleIdFromUrl(""), null);
  });
});
