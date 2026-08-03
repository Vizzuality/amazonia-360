import { describe, expect, it } from "vitest";

import { buildTranslationData } from "./carry-translations";

/** Shaped like the document `payload.create` returns for an indicator, at depth 0. */
const writtenIndicator = () => ({
  id: "doc-1",
  legacy_id: 5,
  name: "Administrative Capitals",
  resource: [
    {
      id: "block-1",
      blockType: "feature",
      url: "https://example.com/FeatureServer/0",
      layer_id: "0",
      popupTemplate: {
        title: "{NOMBCAP}",
        fieldInfos: [
          { id: "info-1", fieldName: "NAME_1", label: "State" },
          { id: "info-2", fieldName: "NAME_0", label: "Country" },
        ],
      },
    },
  ],
});

const localeText = { name: "Capitales Administrativas", description_short: "…" };

describe("buildTranslationData", () => {
  it("carries the block array over with the ids payload assigned", () => {
    const data = buildTranslationData(writtenIndicator(), ["resource"], localeText);
    const resource = data.resource as { id: string; popupTemplate: { fieldInfos: unknown[] } }[];

    // The regression this guards: lose the ids and Payload deletes and recreates the block
    // rows on every locale write instead of reusing them.
    expect(resource[0].id).toBe("block-1");
    expect(resource[0].popupTemplate.fieldInfos).toEqual([
      { id: "info-1", fieldName: "NAME_1", label: "State" },
      { id: "info-2", fieldName: "NAME_0", label: "Country" },
    ]);
  });

  it("keeps the locale's own fields alongside the carried ones", () => {
    const data = buildTranslationData(writtenIndicator(), ["resource"], localeText);

    expect(data.name).toBe("Capitales Administrativas");
    expect(data.description_short).toBe("…");
    expect(data).toHaveProperty("resource");
  });

  it("throws when a locale mapper starts emitting a field that is also carried", () => {
    // A locale mapper emitting `resource` — partial, id-less, and missing the required
    // localized labels — must not be silently discarded or silently allowed to win; either
    // one would hide a real collision. See CARRIED_TO_TRANSLATIONS in
    // scripts/seed-catalogue.ts for where to resolve it.
    expect(() =>
      buildTranslationData(writtenIndicator(), ["resource"], {
        ...localeText,
        resource: [{ blockType: "feature", url: "https://example.com/other" }],
      }),
    ).toThrow(/resource/);
    expect(() =>
      buildTranslationData(writtenIndicator(), ["resource"], {
        ...localeText,
        resource: [{ blockType: "feature", url: "https://example.com/other" }],
      }),
    ).toThrow(/CARRIED_TO_TRANSLATIONS/);
  });

  it("returns only the locale payload when nothing is carried", () => {
    // The topics and subtopics path: neither collection carries any field.
    expect(buildTranslationData(writtenIndicator(), [], localeText)).toEqual(localeText);
  });

  it("omits a carried field that the written document does not have", () => {
    const data = buildTranslationData({ id: "doc-1" }, ["resource"], localeText);

    expect(data).not.toHaveProperty("resource");
    expect(data).toEqual(localeText);
  });

  it("does not mutate the written document or the locale payload", () => {
    const written = writtenIndicator();
    const locale = { ...localeText };
    buildTranslationData(written, ["resource"], locale);

    expect(written).toEqual(writtenIndicator());
    expect(locale).toEqual(localeText);
  });
});
