import { toDataSource, toLegend, toPopup } from "./data-source";

// Mirrors the flat table export: every row carries every column.
const row = (overrides: Record<string, unknown>) => ({
  name: "Layer",
  type: "feature",
  url: "https://services.test/FeatureServer",
  layer_id: "3",
  column: [],
  legend: "",
  rasterFunction: "",
  popupTemplate: "",
  query_table: { where: "1=1" },
  query_chart: { where: "1=1" },
  query_numeric: { where: "1=1" },
  query_ai: { where: "1=1" },
  ...overrides,
});

describe("toDataSource", () => {
  test("emits a feature source with only feature attributes", () => {
    const result = toDataSource(row({}));

    expect(result).toEqual({
      kind: "feature",
      name: "Layer",
      url: "https://services.test/FeatureServer",
      layerId: "3",
      queries: {
        table: { where: "1=1" },
        chart: { where: "1=1" },
        numeric: { where: "1=1" },
        ai: { where: "1=1" },
      },
    });
    expect(result).not.toHaveProperty("rasterFunction");
    expect(result).not.toHaveProperty("column");
    expect(result).not.toHaveProperty("legend");
  });

  test("drops a raster setting from a feature source", () => {
    // Indicator 12 carries rasterFunction on a feature layer, which is
    // meaningless there. Splitting by kind makes it unrepresentable.
    const result = toDataSource(row({ rasterFunction: "Forest_Cover_Change" }));

    expect(result).not.toHaveProperty("rasterFunction");
  });

  test("emits an imagery source with only imagery attributes", () => {
    const result = toDataSource(
      row({
        type: "imagery",
        url: "https://img.test/ImageServer",
        rasterFunction: "Elevation",
        legend: { type: "basic", items: [{ label: "Low", color: "#fff" }] },
      }),
    );

    expect(result).toEqual({
      kind: "imagery",
      name: "Layer",
      url: "https://img.test/ImageServer",
      rasterFunction: "Elevation",
      legend: { type: "basic", items: [{ color: "#fff", label: { en: "Low" } }] },
    });
    expect(result).not.toHaveProperty("layerId");
    expect(result).not.toHaveProperty("queries");
  });

  test("emits an h3 source with only its column", () => {
    const result = toDataSource(row({ type: "h3", column: "ALTMEAN", url: "" }));

    expect(result).toEqual({ kind: "h3", name: "Layer", column: "ALTMEAN" });
  });

  test("keeps an h3 url when one is set", () => {
    const result = toDataSource(row({ type: "h3", column: "X", url: "https://h3.test" }));

    expect(result).toEqual({ kind: "h3", name: "Layer", column: "X", url: "https://h3.test" });
  });

  test("emits a component source with only its name", () => {
    expect(toDataSource(row({ type: "component", name: "total-area" }))).toEqual({
      kind: "component",
      name: "total-area",
    });
  });

  test("throws on an unknown kind rather than emitting something wrong", () => {
    expect(() => toDataSource(row({ type: "web-tile" }))).toThrow(/Unknown resource type/);
    expect(() => toDataSource({})).toThrow(/Unknown resource type/);
  });
});

describe("toLegend", () => {
  test("seeds each item label with English", () => {
    expect(
      toLegend({
        type: "basic",
        items: [
          { label: "Medium High", color: "#74C476" },
          { label: "Very High", color: "#006D2C" },
        ],
      }),
    ).toEqual({
      type: "basic",
      items: [
        { color: "#74C476", label: { en: "Medium High" } },
        { color: "#006D2C", label: { en: "Very High" } },
      ],
    });
  });

  test("returns undefined for an empty or absent legend", () => {
    expect(toLegend("")).toBeUndefined();
    expect(toLegend(undefined)).toBeUndefined();
    expect(toLegend({ type: "basic", items: [] })).toBeUndefined();
  });

  test("defaults a missing type to basic", () => {
    expect(toLegend({ items: [{ label: "x", color: "#000" }] })?.type).toBe("basic");
  });
});

describe("toPopup", () => {
  test("seeds title and field labels with English", () => {
    expect(
      toPopup({
        title: "{NOMBCAP}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "NAME_1", label: "State" },
              { fieldName: "NAME_0", label: "Country" },
            ],
          },
        ],
      }),
    ).toEqual({
      title: { en: "{NOMBCAP}" },
      fields: [
        { fieldName: "NAME_1", label: { en: "State" } },
        { fieldName: "NAME_0", label: { en: "Country" } },
      ],
    });
  });

  test("keeps a title with no content block", () => {
    expect(toPopup({ title: "{DESIGNAT}" })).toEqual({ title: { en: "{DESIGNAT}" }, fields: [] });
  });

  test("treats a literal-text title as translatable content", () => {
    // One Indicator has Spanish text here instead of a field substitution.
    expect(toPopup({ title: "Extensión Global de Manglares" })?.title).toEqual({
      en: "Extensión Global de Manglares",
    });
  });

  test("preserves a field name containing a stray space so it stays visible", () => {
    // `{ECOSYNAM }` silently substitutes nothing today. The transform must not
    // quietly repair it — it is an editorial fix, tracked separately.
    expect(toPopup({ title: "{ECOSYNAM }" })?.title).toEqual({ en: "{ECOSYNAM }" });
  });

  test("returns undefined when there is nothing to show", () => {
    expect(toPopup("")).toBeUndefined();
    expect(toPopup(undefined)).toBeUndefined();
    expect(toPopup({ content: [] })).toBeUndefined();
  });
});
