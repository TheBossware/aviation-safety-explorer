import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { articleIdFromUrl, decideScope } from "./scope";

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

describe("decideScope", () => {
  it("accepts AvHerald items by source_id and article url", () => {
    assert.deepEqual(decideScope({ source_id: "avherald", url: "https://avherald.com/h?article=529de372" }), {
      inScope: true,
      articleId: "529de372",
    });
  });

  it("rejects other sources even when the url is AvHerald's", () => {
    const decision = decideScope({ source_id: "airbus", url: "https://avherald.com/h?article=529de372" });
    assert.equal(decision.inScope, false);
  });

  it("rejects AvHerald items without an article url", () => {
    const decision = decideScope({ source_id: "avherald", url: "https://bsky.app/profile/avherald.com/post/x" });
    assert.equal(decision.inScope, false);
  });
});
