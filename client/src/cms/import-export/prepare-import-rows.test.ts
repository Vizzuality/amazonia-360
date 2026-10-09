import { Indicators } from "@/cms/collections/Indicators";

import { IMPORT_ROW_ERRORS, prepareImportRows } from "./prepare-import-rows";

const LOCALES = ["en", "es", "pt"] as const;

const prepare = (rows: Record<string, unknown>[], existing: Record<string, unknown>[] = []) =>
  prepareImportRows(rows, {
    fields: Indicators.fields,
    locales: LOCALES,
    defaultLocale: "en",
    existing: new Map(existing.map((doc) => [String(doc.id), doc])),
  });

const newIndicator = (overrides: Record<string, unknown> = {}) => ({
  id: "900",
  _status: "published",
  order: 1,
  subtopic: "3",
  name: { en: "Forest loss" },
  description_short: { en: "Hectares of forest lost" },
  ...overrides,
});

const STORED = {
  id: "7",
  _status: "published",
  name: { en: "Slope", es: "Pendiente", pt: "Declive" },
  description_short: { en: "Terrain steepness", es: "Inclinación", pt: null },
};

describe("prepareImportRows", () => {
  test("writes a value with no locale under the default locale, whatever the admin browses in", () => {
    const [row] = prepare([newIndicator({ name: "Forest loss", unit: "ha" })]);

    expect(row).toMatchObject({ name: { en: "Forest loss" }, unit: { en: "ha" } });
    expect(row).not.toHaveProperty(IMPORT_ROW_ERRORS);
  });

  test("keeps the default locale first in line, so a Spanish-only edit never lands in English", () => {
    // The plugin writes the first locale it finds through the default-locale request. A map
    // without `en` would put the Spanish text in the English slot.
    const [row] = prepare([{ id: "7", _status: "published", name: { es: "Pendiente" } }], [STORED]);

    expect(Object.keys(row.name as object)).toEqual(["en", "es"]);
    expect(row.name).toEqual({ en: undefined, es: "Pendiente" });
  });

  describe("a resource whose legend is translated", () => {
    const imagery = (labels: unknown[]) => [
      {
        blockType: "imagery",
        url: "https://example.org/ImageServer",
        rasterFunction: { functionName: "Colormap" },
        legend: {
          type: "basic",
          items: labels.map((label, index) => ({ label, color: `#00000${index}` })),
        },
      },
    ];

    test("is split into one resource per locale, which is how the plugin writes each locale", () => {
      const [row] = prepare([
        newIndicator({
          resource: imagery([
            { en: "Low", es: "Bajo" },
            { en: "High", es: "Alto" },
          ]),
        }),
      ]);

      expect(row.resource).toEqual({
        en: imagery(["Low", "High"]),
        es: imagery(["Bajo", "Alto"]),
      });
    });

    test("is refused when a translated label is not text, before the plugin can drop it", () => {
      const [row] = prepare([newIndicator({ resource: imagery([{ en: "Low", es: 5 }]) })]);

      expect(row[IMPORT_ROW_ERRORS]).toEqual([
        "`resource` has a `label` in `es` that is not text.",
      ]);
    });

    test("stays a single resource when no label is translated", () => {
      const [row] = prepare([newIndicator({ resource: imagery(["Low", "High"]) })]);

      expect(row.resource).toEqual(imagery(["Low", "High"]));
    });
  });

  describe("rejects a row", () => {
    const errorsOf = (row: Record<string, unknown>, existing?: Record<string, unknown>[]) =>
      prepare([row], existing)[0][IMPORT_ROW_ERRORS];

    test("with no Content Code: a person chooses it, the CMS never hands one out", () => {
      const { id: _id, ...row } = newIndicator();

      expect(errorsOf(row)).toEqual([
        "Content Code (`id`) is missing. Every catalogue row names its own.",
      ]);
      expect(errorsOf({ ...row, id: "" })).toHaveLength(1);
    });

    test("with no _status, rather than publishing it by default", () => {
      const { _status, ...row } = newIndicator();

      expect(errorsOf(row)).toEqual([
        '`_status` is missing. Set "draft" or "published" on every row.',
      ]);
    });
  });

  describe("required translations", () => {
    const errorsOf = (row: Record<string, unknown>) =>
      prepare([row], [STORED])[0][IMPORT_ROW_ERRORS];

    test("a new entry needs English for every required field, since the others fall back to it", () => {
      const { description_short: _omitted, ...row } = newIndicator();

      expect(errorsOf(row)).toEqual([
        "`description_short` is required in `en`, and this row leaves it empty.",
      ]);
    });

    test("a locale the row writes must end up complete, or Payload refuses it without telling anyone", () => {
      // Stored Slope has no Portuguese short description. Saving only the Portuguese name
      // would fail inside the plugin, which logs it and still reports the row as imported.
      expect(errorsOf({ id: "7", _status: "published", name: { pt: "Inclinação" } })).toEqual([
        "`description_short` is required in `pt`, and this row leaves it empty.",
      ]);
    });

    test("a translation the CMS already holds completes the locale", () => {
      expect(
        errorsOf({ id: "7", _status: "published", name: { es: "Pendiente del terreno" } }),
      ).toBeUndefined();
    });

    test("clearing a required field with null is refused in any locale", () => {
      expect(errorsOf({ id: "7", _status: "published", name: { es: null } })).toEqual([
        "`name` is required in `es`, and this row leaves it empty.",
      ]);
    });

    test("a translation that is not text is refused before the plugin can drop it", () => {
      expect(errorsOf({ id: "7", _status: "published", name: { es: 2020 } })).toEqual([
        "`name` in `es` must be text.",
      ]);
    });
  });

  test("reads a numeric Content Code as the text the CMS stores", () => {
    const [row] = prepare([newIndicator({ id: 900, subtopic: 3 })]);

    expect(row.id).toBe("900");
  });

  test("reads a relationship as the Content Code it points at, as exported or as typed", () => {
    // The plugin exports at depth 1, so a relationship comes back as the whole related entry.
    const [exported, typed] = prepare([
      newIndicator({ subtopic: { id: "3", name: "Forests" }, replaces: { id: "11" } }),
      newIndicator({ subtopic: 3, replaces: 11 }),
    ]);

    expect(exported).toMatchObject({ subtopic: "3", replaces: "11" });
    expect(typed).toMatchObject({ subtopic: "3", replaces: "11" });
  });
});
