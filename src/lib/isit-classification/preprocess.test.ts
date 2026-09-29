import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildRelations,
  fingerprint,
  parseArticleHeader,
  parseEventDate,
  planPreprocessUpdate,
  preprocess,
} from "./preprocess";

const REVOCATION_TITLE =
  "REVOCATION: The post published by us on 04.07.2025: “Incident: Go2Sky B738 at Zakynthos on Jun 29th 2025, engine trouble avherald.com/h?article=529de372” is untrue. We hereby revoke this statement.";
const HEADER = "By Simon Hradecky, created Friday, Jul 4th 2025 08:21Z, last updated Saturday, Jul 5th 2025 08:29Z A Go2Sky Boeing 737-800 ...";

function item(overrides: Partial<Parameters<typeof preprocess>[0]> = {}) {
  return {
    title: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
    summary: "Incident: Swiss A333 over Atlantic on Aug 9th 2026, smoke in cabin",
    content:
      "By Simon Hradecky, created Monday, Aug 10th 2026 11:47Z, last updated Monday, Aug 10th 2026 19:15Z A Swiss Airbus A330-300 ...",
    url: "https://avherald.com/h?article=53d51269",
    published_at: new Date("2026-08-10T12:00:00Z"),
    content_note: null,
    ...overrides,
  };
}

describe("fingerprint", () => {
  it("changes when any of title, summary, content or url changes", () => {
    const base = fingerprint(item());
    for (const field of ["title", "summary", "content", "url"] as const) {
      assert.notEqual(fingerprint(item({ [field]: `${item()[field]} changed` })), base, field);
    }
  });

  it("ignores whitespace-only differences", () => {
    assert.equal(fingerprint(item({ content: `  ${item().content.replace(/ /g, "\n ")}  ` })), fingerprint(item()));
  });

  it("does not collide when text moves between fields", () => {
    assert.notEqual(fingerprint(item({ title: "a b", summary: "c" })), fingerprint(item({ title: "a", summary: "b c" })));
  });
});

describe("date parsing", () => {
  it("parses the occurrence date from the title", () => {
    assert.deepEqual(parseEventDate(item().title), new Date("2026-08-09T00:00:00Z"));
    assert.deepEqual(parseEventDate("Incident: United B764 near Newark on Aug 28h 2026, lost RVSM"), new Date("2026-08-28T00:00:00Z"));
    assert.equal(parseEventDate("News: AVH was sued"), null);
    assert.equal(parseEventDate("Incident: X on Feb 31st 2026, y"), null);
  });

  it("parses the article header dates", () => {
    assert.deepEqual(parseArticleHeader(HEADER), {
      createdAt: new Date("2025-07-04T08:21:00Z"),
      updatedAt: new Date("2025-07-05T08:29:00Z"),
    });
    assert.deepEqual(parseArticleHeader("no header here"), { createdAt: null, updatedAt: null });
  });
});

describe("preprocess flags", () => {
  it("flags nothing on an ordinary incident", () => {
    const result = preprocess(item());
    assert.deepEqual(result.flags, []);
    assert.deepEqual(result.eventDate, new Date("2026-08-09T00:00:00Z"));
    assert.deepEqual(result.articleUpdatedAt, new Date("2026-08-10T19:15:00Z"));
  });

  it("flags the REVOCATION post and extracts the withdrawn article", () => {
    const result = preprocess(
      item({
        title: REVOCATION_TITLE,
        summary: REVOCATION_TITLE,
        content: HEADER,
        url: "https://avherald.com/h?article=529de372",
        published_at: new Date("2026-08-05T17:54:00Z"),
      })
    );
    assert.deepEqual(result.flags, ["retraction_candidate", "title_references_other_post", "late_report"]);
    assert.equal(result.referencedArticleId, "529de372");
    // The quoted incident date is kept apart from the post date.
    assert.deepEqual(result.eventDate, new Date("2025-06-29T00:00:00Z"));
  });

  it("flags non-occurrence posts", () => {
    assert.deepEqual(preprocess(item({ title: "News: AVH was sued" })).flags, ["non_occurrence_candidate"]);
  });

  it("flags an occurrence date after the post date", () => {
    const result = preprocess(
      item({ title: "Report: REX SF34 at Townsville on Nov 19th 2026, uncommanded turn", published_at: new Date("2026-09-01T00:00:00Z") })
    );
    assert.ok(result.flags.includes("date_anomaly"));
  });

  it("flags late reports and missing dates or content", () => {
    assert.ok(preprocess(item({ published_at: new Date("2026-10-01T00:00:00Z") })).flags.includes("late_report"));
    assert.ok(preprocess(item({ title: "Incident: Delta B753 near Denver, pressurization" })).flags.includes("missing_event_date"));
    assert.ok(preprocess(item({ content: "" })).flags.includes("missing_content"));
  });
});

describe("buildRelations", () => {
  it("links a revocation to the withdrawn post but never as same_article", () => {
    const relations = buildRelations([
      { newsId: "rev", articleId: "529de372", referencedArticleId: "529de372", isRetraction: true },
      { newsId: "orig", articleId: "529de372", referencedArticleId: null, isRetraction: false },
    ]);
    assert.deepEqual(relations.get("rev"), [{ type: "revokes", news_id: "orig", article_id: "529de372", confirmed: false }]);
    assert.deepEqual(relations.get("orig"), [{ type: "same_article", news_id: "rev", article_id: "529de372", confirmed: false }]);
  });

  it("keeps the article id when the withdrawn post is not stored", () => {
    const relations = buildRelations([{ newsId: "rev", articleId: "529de372", referencedArticleId: "529de372", isRetraction: true }]);
    assert.deepEqual(relations.get("rev"), [{ type: "revokes", news_id: null, article_id: "529de372", confirmed: false }]);
  });

  it("suggests same_article for updates of one article, unconfirmed", () => {
    const relations = buildRelations([
      { newsId: "a", articleId: "x1", referencedArticleId: null, isRetraction: false },
      { newsId: "b", articleId: "x1", referencedArticleId: null, isRetraction: false },
      { newsId: "c", articleId: "x2", referencedArticleId: null, isRetraction: false },
    ]);
    assert.deepEqual(relations.get("a"), [{ type: "same_article", news_id: "b", article_id: "x1", confirmed: false }]);
    assert.deepEqual(relations.get("c"), []);
  });
});

describe("planPreprocessUpdate", () => {
  const result = preprocess(item());
  const stored = (overrides: Partial<Parameters<typeof planPreprocessUpdate>[0]> = {}) => ({
    workflow_status: "pending" as const,
    flags: [] as string[],
    relations: [],
    input: { fingerprint: null as string | null },
    dates: { event_date: null, article_created_at: null, article_updated_at: null },
    ...overrides,
  });

  it("first run fills fields without treating the input as changed", () => {
    const plan = planPreprocessUpdate(stored(), result, []);
    assert.equal(plan.changed, true);
    assert.equal(plan.inputChanged, false);
    assert.equal(plan.set.workflow_status, "pending");
  });

  it("is a no-op when nothing changed", () => {
    const first = planPreprocessUpdate(stored(), result, []);
    const again = planPreprocessUpdate(
      stored({ input: { fingerprint: result.fingerprint }, dates: first.set.dates, flags: first.set.flags }),
      result,
      []
    );
    assert.equal(again.changed, false);
  });

  it("marks an approved record stale on changed input, never back to pending", () => {
    const plan = planPreprocessUpdate(stored({ workflow_status: "approved", input: { fingerprint: "old" } }), result, []);
    assert.equal(plan.set.workflow_status, "stale");
    assert.ok(plan.set.flags.includes("input_changed"));
    assert.equal("final" in plan.set, false);
  });

  it("sends AI-only results back to pending on changed input", () => {
    for (const status of ["ai_suggested", "needs_review", "ai_failed"] as const) {
      const plan = planPreprocessUpdate(stored({ workflow_status: status, input: { fingerprint: "old" } }), result, []);
      assert.equal(plan.set.workflow_status, "pending", status);
    }
  });

  it("replaces its own flags but keeps flags set by other stages", () => {
    const plan = planPreprocessUpdate(stored({ flags: ["late_report", "code_dropped"] }), result, []);
    assert.deepEqual(plan.set.flags, ["code_dropped"]);
  });
});

describe("retraction detection", () => {
  it("does not mistake landing gear retraction for an editorial retraction", () => {
    const title = "Incident: Thai B773 at Frankfurt on Aug 21st 2026, could not fully retract landing gear";
    assert.equal(preprocess(item({ title })).flags.includes("retraction_candidate"), false);
  });

  it("recognizes editorial retractions and corrections", () => {
    for (const title of [REVOCATION_TITLE, "CORRECTION: Incident: X on Aug 1st 2026, y", "Retraction: earlier report"]) {
      assert.ok(preprocess(item({ title })).flags.includes("retraction_candidate"), title);
    }
  });
});

describe("retraction wording without a prefix", () => {
  it("matches editorial phrases anywhere in the title", () => {
    for (const title of ["  REVOCATION : x", "The earlier post is untrue", "We hereby revoke this statement", "we retract our report"]) {
      assert.ok(preprocess(item({ title })).flags.includes("retraction_candidate"), title);
    }
  });

  it("ignores lookalike words", () => {
    for (const title of ["Incident: A320 at X on Aug 1st 2026, gear retracted early", "Incident: sbhereby"]) {
      assert.equal(preprocess(item({ title })).flags.includes("retraction_candidate"), false, title);
    }
  });
});
