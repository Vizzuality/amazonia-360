import { describe, expect, it } from "vitest";

import { rawSubtopics } from "./source";
import { SUBTOPIC_NAMES } from "./translations";

describe("SUBTOPIC_NAMES", () => {
  it("covers every subtopic legacy_id exactly, with no extras", () => {
    expect(
      Object.keys(SUBTOPIC_NAMES)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(rawSubtopics.map((s) => s.id).sort((a, b) => a - b));
  });

  it("supplies a non-empty, trimmed es and pt name for all 28", () => {
    expect(Object.keys(SUBTOPIC_NAMES)).toHaveLength(28);
    for (const [id, names] of Object.entries(SUBTOPIC_NAMES)) {
      expect(names.es.trim(), `es for ${id}`).toBe(names.es);
      expect(names.pt.trim(), `pt for ${id}`).toBe(names.pt);
      expect(names.es.length, `es for ${id}`).toBeGreaterThan(0);
      expect(names.pt.length, `pt for ${id}`).toBeGreaterThan(0);
    }
  });

  it("leaves the undefined ACU acronym untranslated and expands IDB to BID", () => {
    expect(SUBTOPIC_NAMES[0]).toEqual({ es: "ACU", pt: "ACU" });
    expect(SUBTOPIC_NAMES[33]).toEqual({ es: "BID", pt: "BID" });
  });
});
