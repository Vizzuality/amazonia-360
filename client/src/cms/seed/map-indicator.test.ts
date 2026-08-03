import { describe, expect, it } from "vitest";

import { INDICATOR_ADDS_CHART, INDICATOR_DROPS_RASTER_FUNCTION } from "./fixes";
import { mapIndicatorBase, mapIndicatorLocale, mapResource } from "./map-indicator";
import { rawIndicators, rawSubtopics, type RawResource } from "./source";

const subtopicIds = new Map(rawSubtopics.map((s) => [s.id, `uuid-sub-${s.id}`] as const));
const byId = (id: number) => rawIndicators.find((i) => i.id === id)!;

describe("mapResource block selection", () => {
  it("uses resource.type verbatim as blockType for every one of the 164 rows", () => {
    for (const row of rawIndicators) {
      const [block] = mapResource(row.resource, row.id);
      expect(block.blockType, `indicator ${row.id}`).toBe(row.resource.type);
    }
  });

  it("returns exactly one block per indicator", () => {
    for (const row of rawIndicators) {
      expect(mapResource(row.resource, row.id), `indicator ${row.id}`).toHaveLength(1);
    }
  });

  it("maps the two block types absent from the source data", () => {
    const imageryTile: RawResource = {
      type: "imagery-tile",
      name: "Tiled",
      url: "https://example.test/tiles",
      rasterFunction: { functionName: "Colormap" },
      legend: { type: "basic", items: [{ label: "A", color: "#FFFFFF" }] },
    };
    expect(mapResource(imageryTile, 900)[0]).toEqual({
      blockType: "imagery-tile",
      name: "Tiled",
      url: "https://example.test/tiles",
      rasterFunction: { functionName: "Colormap" },
      legend: { type: "basic", items: [{ label: "A", color: "#FFFFFF" }] },
    });

    const webTile: RawResource = { type: "web-tile", name: "Web", url: "https://example.test/w" };
    expect(mapResource(webTile, 901)[0]).toEqual({
      blockType: "web-tile",
      name: "Web",
      url: "https://example.test/w",
    });
  });

  it("throws on an unknown resource type", () => {
    expect(() => mapResource({ type: "nope" }, 902)).toThrow(/unknown resource type/i);
  });
});

describe("mapResource field selection", () => {
  it("drops the inert layer_id on h3, imagery and component blocks", () => {
    for (const row of rawIndicators) {
      if (row.resource.type === "feature") continue;
      expect(row.resource.layer_id, `indicator ${row.id}`).toBe("0");
      expect(mapResource(row.resource, row.id)[0], `indicator ${row.id}`).not.toHaveProperty(
        "layer_id",
      );
    }
  });

  it("keeps layer_id as the source string on feature blocks", () => {
    const row = byId(5);
    const block = mapResource(row.resource, 5)[0];
    expect(block).toHaveProperty("layer_id");
    expect((block as { layer_id: string }).layer_id).toBe(row.resource.layer_id);
  });

  it("unwraps popupTemplate.content into the group", () => {
    const block = mapResource(byId(5).resource, 5)[0] as {
      popupTemplate?: { title?: string; fieldInfos?: { fieldName: string; label: string }[] };
    };
    expect(block.popupTemplate?.title).toBe("{NOMBCAP}");
    expect(block.popupTemplate?.fieldInfos).toEqual([
      { fieldName: "NAME_1", label: "State" },
      { fieldName: "NAME_0", label: "Country" },
    ]);
    expect(block.popupTemplate).not.toHaveProperty("content");
  });

  it("keeps title-only popupTemplates and omits fieldInfos", () => {
    const titleOnly = rawIndicators.find((i) => {
      const pt = i.resource.popupTemplate as { title?: string; content?: unknown[] } | undefined;
      return Boolean(pt?.title) && (pt?.content ?? []).length === 0;
    })!;
    const block = mapResource(titleOnly.resource, titleOnly.id)[0] as {
      popupTemplate?: { title?: string; fieldInfos?: unknown };
    };
    expect(block.popupTemplate?.title).toBeTruthy();
    expect(block.popupTemplate).not.toHaveProperty("fieldInfos");
  });

  it("maps the imagery legend with its type and all items", () => {
    const imagery = rawIndicators.find((i) => i.resource.type === "imagery")!;
    const block = mapResource(imagery.resource, imagery.id)[0] as {
      legend: { type: string; items: { label: string; color: string }[] };
    };
    expect(block.legend.type).toBe("basic");
    expect(block.legend.items.length).toBeGreaterThan(0);
    for (const item of block.legend.items) {
      expect(Object.keys(item).sort()).toEqual(["color", "label"]);
    }
  });

  it("applies fix 3: drops rasterFunction from indicator 12's feature block", () => {
    const row = byId(INDICATOR_DROPS_RASTER_FUNCTION);
    expect(row.resource.rasterFunction).toBe("Forest_Cover_Change");
    expect(mapResource(row.resource, row.id)[0]).not.toHaveProperty("rasterFunction");
  });

  it("satisfies each block's required fields on all 164 rows", () => {
    for (const row of rawIndicators) {
      const block = mapResource(row.resource, row.id)[0] as Record<string, unknown>;
      const required: Record<string, string[]> = {
        feature: ["url", "layer_id"],
        imagery: ["url", "rasterFunction", "legend"],
        "imagery-tile": ["url", "rasterFunction", "legend"],
        "web-tile": ["url"],
        h3: ["name", "column"],
        component: ["name"],
      };
      for (const key of required[block.blockType as string]) {
        expect(block[key], `indicator ${row.id} needs ${key}`).toBeDefined();
        expect(block[key], `indicator ${row.id} ${key} must not be null`).not.toBeNull();
      }
      if (block.blockType === "imagery" || block.blockType === "imagery-tile") {
        const legend = block.legend as { items: unknown[] };
        expect(legend.items.length, `indicator ${row.id} legend.items`).toBeGreaterThan(0);
      }
    }
  });
});

describe("mapIndicatorBase", () => {
  it("resolves the subtopic and applies fix 2 to indicator 5", () => {
    const data = mapIndicatorBase(byId(INDICATOR_ADDS_CHART), subtopicIds);
    expect(data.subtopic).toBe(`uuid-sub-${byId(INDICATOR_ADDS_CHART).subtopic_id}`);
    expect(data.visualization_types).toEqual(["map", "numeric", "chart"]);
  });

  it("maps all 164 rows with required fields present and order preserved", () => {
    for (const row of rawIndicators) {
      const data = mapIndicatorBase(row, subtopicIds);
      expect(data.legacy_id, `indicator ${row.id}`).toBe(row.id);
      expect(data.order, `indicator ${row.id}`).toBe(row.order);
      expect(data.name.length, `indicator ${row.id}`).toBeGreaterThan(0);
      expect(data.description_short.length, `indicator ${row.id}`).toBeGreaterThan(0);
      expect(data.subtopic, `indicator ${row.id}`).toBeTruthy();
    }
    expect(rawIndicators).toHaveLength(164);
  });

  it("throws on an unresolvable subtopic", () => {
    expect(() => mapIndicatorBase(byId(5), new Map())).toThrow(/subtopic/i);
  });
});

describe("mapIndicatorLocale", () => {
  it("carries only flat localized text, never blocks", () => {
    for (const row of rawIndicators) {
      for (const locale of ["es", "pt"] as const) {
        const data = mapIndicatorLocale(row, locale) as Record<string, unknown>;
        expect(data, `indicator ${row.id}`).not.toHaveProperty("resource");
        expect(data, `indicator ${row.id}`).not.toHaveProperty("subtopic");
        expect(data, `indicator ${row.id}`).not.toHaveProperty("legacy_id");
        expect(data, `indicator ${row.id}`).not.toHaveProperty("visualization_types");
        for (const key of Object.keys(data)) {
          expect(["name", "unit", "description", "description_short"]).toContain(key);
        }
      }
    }
  });

  it("supplies es and pt names for all 164 rows", () => {
    for (const row of rawIndicators) {
      expect(mapIndicatorLocale(row, "es").name, `indicator ${row.id}`).toBeTruthy();
      expect(mapIndicatorLocale(row, "pt").name, `indicator ${row.id}`).toBeTruthy();
    }
  });

  it("trims every mapped value in every locale (fix 4)", () => {
    for (const row of rawIndicators) {
      for (const locale of ["en", "es", "pt"] as const) {
        const data =
          locale === "en" ? mapIndicatorBase(row, subtopicIds) : mapIndicatorLocale(row, locale);
        for (const [key, value] of Object.entries(data)) {
          if (typeof value !== "string") continue;
          expect(value, `indicator ${row.id} ${locale}.${key}`).toBe(value.trim());
        }
      }

      const block = mapResource(row.resource, row.id)[0] as Record<string, unknown>;

      const popupTemplate = block.popupTemplate as
        | { fieldInfos?: { fieldName: string; label: string }[] }
        | undefined;
      for (const field of popupTemplate?.fieldInfos ?? []) {
        expect(field.fieldName, `indicator ${row.id} popupTemplate.fieldName`).toBe(
          field.fieldName.trim(),
        );
        expect(field.label, `indicator ${row.id} popupTemplate.label`).toBe(field.label.trim());
      }

      const legend = block.legend as { items?: { label: string; color: string }[] } | undefined;
      for (const item of legend?.items ?? []) {
        expect(item.label, `indicator ${row.id} legend.label`).toBe(item.label.trim());
        expect(item.color, `indicator ${row.id} legend.color`).toBe(item.color.trim());
      }
    }
  });

  it("trims indicator 140's fieldName, fixing the broken ArcGIS field match", () => {
    const row = byId(140);
    expect(
      (row.resource.popupTemplate as { content: { fieldInfos: { fieldName: string }[] }[] })
        .content[0].fieldInfos[0].fieldName,
    ).toBe("LENGTHm ");

    const block = mapResource(row.resource, 140)[0] as {
      popupTemplate?: { fieldInfos?: { fieldName: string; label: string }[] };
    };
    expect(block.popupTemplate?.fieldInfos?.[0].fieldName).toBe("LENGTHm");
  });
});
