import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { extractedByLabel, toExtraction } from "./extract";

const BY = "claude-opus-5-5 (automatic, prompt test)";

describe("toExtraction", () => {
  it("returns empty lists when no airline is named", () => {
    assert.deepEqual(toExtraction({ mentions: [] }, BY), { airlines: [], roles: [], extractedBy: BY });
  });

  it("puts the operator before the airline it flew for", () => {
    const result = toExtraction(
      {
        mentions: [
          { name: "Ryanair", role: "on_behalf_of" },
          { name: "Malta Air", role: "operator" },
        ],
      },
      BY
    );
    assert.deepEqual(result.airlines, ["Malta Air", "Ryanair"]);
    assert.deepEqual(result.roles, [
      { name: "Malta Air", role: "operator" },
      { name: "Ryanair", role: "on_behalf_of" },
    ]);
  });

  it("keeps two operators in the order given", () => {
    const result = toExtraction(
      {
        mentions: [
          { name: "Delta Air Lines", role: "operator" },
          { name: "Endeavor Air", role: "operator" },
        ],
      },
      BY
    );
    assert.deepEqual(result.airlines, ["Delta Air Lines", "Endeavor Air"]);
  });

  it("drops repeated name + role pairs, ignoring case and spaces", () => {
    const result = toExtraction(
      {
        mentions: [
          { name: "Qantas", role: "subject" },
          { name: " qantas ", role: "subject" },
        ],
      },
      BY
    );
    assert.deepEqual(result.roles, [{ name: "Qantas", role: "subject" }]);
    assert.deepEqual(result.airlines, ["Qantas"]);
  });

  it("lists a name once in airlines even when it has two roles", () => {
    const result = toExtraction(
      {
        mentions: [
          { name: "Lufthansa", role: "subject" },
          { name: "Lufthansa", role: "operator" },
        ],
      },
      BY
    );
    assert.equal(result.roles.length, 2);
    assert.equal(result.roles[0].role, "operator");
    assert.deepEqual(result.airlines, ["Lufthansa"]);
  });

  it("drops empty names", () => {
    assert.deepEqual(toExtraction({ mentions: [{ name: "  ", role: "operator" }] }, BY).airlines, []);
  });
});

describe("extractedByLabel", () => {
  it("names the model and the prompt version", () => {
    assert.equal(extractedByLabel("claude-opus-5-5", "2026-10-01.1"), "claude-opus-5-5 (automatic, prompt 2026-10-01.1)");
  });
});
