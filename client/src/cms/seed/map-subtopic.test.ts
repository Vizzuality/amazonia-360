import { describe, expect, it } from "vitest";

import { mapSubtopicBase, mapSubtopicLocale } from "./map-subtopic";
import { rawSubtopics, rawTopics } from "./source";

const topicIds = new Map(rawTopics.map((t) => [t.id, `uuid-topic-${t.id}`] as const));

describe("mapSubtopicBase", () => {
  it("resolves the topic relationship and omits default_visualization", () => {
    const row = rawSubtopics.find((s) => s.id === 26)!;
    const data = mapSubtopicBase(row, topicIds);

    expect(data.legacy_id).toBe(26);
    expect(data.topic).toBe(`uuid-topic-${row.topic_id}`);
    expect(data).not.toHaveProperty("default_visualization");
  });

  it("trims the untrimmed name on subtopic 3 (fix 4)", () => {
    const row = rawSubtopics.find((s) => s.id === 3)!;
    expect(row.name_en).toBe("Land Cover\n\n");
    expect(mapSubtopicBase(row, topicIds).name).toBe("Land Cover");
  });

  it("resolves every topic_id for all 28 rows", () => {
    for (const row of rawSubtopics) {
      expect(mapSubtopicBase(row, topicIds).topic, `subtopic ${row.id}`).toBeTruthy();
    }
    expect(rawSubtopics).toHaveLength(28);
  });

  it("drops the image field, which no collection field accepts", () => {
    for (const row of rawSubtopics) {
      expect(mapSubtopicBase(row, topicIds)).not.toHaveProperty("image");
    }
  });

  it("throws on an unresolvable topic rather than writing a dangling row", () => {
    const row = rawSubtopics[0];
    expect(() => mapSubtopicBase(row, new Map())).toThrow(/topic/i);
  });
});

describe("mapSubtopicLocale", () => {
  it("uses the translation table, since the source has no es or pt names", () => {
    const row = rawSubtopics.find((s) => s.id === 26)!;
    expect(row.name_es).toBe("");
    expect(mapSubtopicLocale(row, "es").name).toBe("Infraestructura de Seguridad");
    expect(mapSubtopicLocale(row, "pt").name).toBe("Infraestrutura de Segurança");
  });

  it("supplies a name for all 28 rows in both locales", () => {
    for (const row of rawSubtopics) {
      expect(mapSubtopicLocale(row, "es").name, `subtopic ${row.id}`).toBeTruthy();
      expect(mapSubtopicLocale(row, "pt").name, `subtopic ${row.id}`).toBeTruthy();
    }
  });

  it("omits description, which is empty in every locale on every row", () => {
    for (const row of rawSubtopics) {
      expect(mapSubtopicLocale(row, "es")).not.toHaveProperty("description");
    }
  });
});
