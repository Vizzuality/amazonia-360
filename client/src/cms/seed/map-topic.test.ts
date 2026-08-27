import { describe, expect, it } from "vitest";

import { mapTopicBase, mapTopicLocale } from "./map-topic";
import { rawTopics, type RawTopic } from "./source";

describe("mapTopicBase", () => {
  it("maps the en payload without default_visualization", () => {
    const row = rawTopics.find((t) => t.id === 3)!;
    const data = mapTopicBase(row);

    expect(data.legacy_id).toBe(3);
    expect(data.name).toBe(row.name_en);
    expect(data).not.toHaveProperty("default_visualization");
  });

  it("throws when name_en is blank rather than writing a nameless topic", () => {
    const row = { id: 999, name_en: "  " } as RawTopic;
    expect(() => mapTopicBase(row)).toThrow(/name_en/i);
  });

  it("produces a valid payload for all 9 rows", () => {
    for (const row of rawTopics) {
      const data = mapTopicBase(row);
      expect(typeof data.legacy_id, `topic ${row.id}`).toBe("number");
      expect(data.name.length, `topic ${row.id}`).toBeGreaterThan(0);
      expect(data.name, `topic ${row.id}`).toBe(data.name.trim());
    }
    expect(rawTopics).toHaveLength(9);
  });

  it("keeps image as a path string on the 8 rows that have one", () => {
    const withImage = rawTopics.filter((t) => mapTopicBase(t).image !== undefined);
    expect(withImage).toHaveLength(8);
  });
});

describe("mapTopicLocale", () => {
  it("carries only localized text", () => {
    const row = rawTopics.find((t) => t.id === 3)!;
    expect(Object.keys(mapTopicLocale(row, "es")).sort()).toEqual(["description", "name"]);
  });

  it("supplies es and pt names for all 9 rows", () => {
    for (const row of rawTopics) {
      expect(mapTopicLocale(row, "es").name, `topic ${row.id}`).toBeTruthy();
      expect(mapTopicLocale(row, "pt").name, `topic ${row.id}`).toBeTruthy();
    }
  });
});
