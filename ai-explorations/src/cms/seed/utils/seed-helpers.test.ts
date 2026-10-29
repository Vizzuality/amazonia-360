import type { Payload } from "payload";

import { describe, expect, test } from "vitest";

import { updateLocales } from "./seed-helpers";

type Call = { collection: string; id: string; locale: string; data: Record<string, unknown> };

const fakePayload = () => {
  const updated: Call[] = [];
  const payload = {
    update: async (args: Call) => {
      updated.push(args);
      return {};
    },
  } as unknown as Payload;
  return { payload, updated };
};

describe("updateLocales", () => {
  test.each(["topics", "subtopics", "indicators"] as const)(
    "publishes the es and pt locales of %s",
    async (collection) => {
      const { payload, updated } = fakePayload();

      await updateLocales(payload, collection, "1", { name: { en: "A", es: "B", pt: "C" } });

      expect(updated.map(({ locale, data }) => [locale, data])).toEqual([
        ["es", { name: "B", _status: "published" }],
        ["pt", { name: "C", _status: "published" }],
      ]);
    },
  );

  test("publishes a locale without translations with the English values", async () => {
    const { payload, updated } = fakePayload();

    await updateLocales(payload, "subtopics", "1", { name: { en: "A", es: "", pt: "" } });

    expect(updated.map(({ locale, data }) => [locale, data])).toEqual([
      ["es", { name: "A", _status: "published" }],
      ["pt", { name: "A", _status: "published" }],
    ]);
  });

  test("clears a clearWhenEmpty field instead of copying English", async () => {
    const { payload, updated } = fakePayload();

    await updateLocales(
      payload,
      "indicators",
      "1",
      { name: { en: "A", es: "B", pt: "C" }, unit: { en: "km", es: "", pt: "" } },
      ["unit"],
    );

    expect(updated.map(({ data }) => data.unit)).toEqual([null, null]);
  });

  test.each(["country-modules", "partners"] as const)(
    "writes %s translations without a status",
    async (collection) => {
      const { payload, updated } = fakePayload();

      await updateLocales(payload, collection, "1", { name: { en: "A", es: "B", pt: "" } });

      expect(updated.map(({ locale, data }) => [locale, data])).toEqual([["es", { name: "B" }]]);
    },
  );
});
