import { AdminUnit } from "@/lib/admin-hierarchy";

import { ResourceFeature } from "@/types/indicator";

type Rows = Record<string, unknown>[];

const queries: { url: string; query: Record<string, unknown> }[] = [];
let layerRows: Record<string, Rows> = {};

vi.mock("@arcgis/core/layers/FeatureLayer", () => ({
  default: class MockFeatureLayer {
    url: string;
    layerId = 0;
    objectIdField = "FID";

    constructor({ url }: { url: string }) {
      this.url = url;
    }

    async queryFeatures(query: Record<string, unknown>) {
      queries.push({ url: this.url, query });
      const rows = layerRows[this.url] ?? [];
      const ids = query.objectIds as unknown[] | undefined;
      const matched = ids ? rows.filter((row) => ids.includes(row.FID)) : rows;

      return { features: matched.map((attributes) => ({ attributes })), fields: [] };
    }
  },
}));

vi.mock("@arcgis/core/rest/support/FeatureSet", () => ({
  default: class MockFeatureSet {
    constructor(properties?: Record<string, unknown>) {
      Object.assign(this, properties || {});
    }
  },
}));

const { getQueryFeatureId } = await import("@/lib/indicators");

const BASE = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services";

const resource = (service: string, layerId: string): ResourceFeature =>
  ({
    type: "feature",
    url: `${BASE}/${service}/FeatureServer/`,
    layer_id: layerId,
    query_numeric: {
      where: "1=1",
      outStatistics: [
        { onStatisticField: "FID", outStatisticFieldName: "value", statisticType: "count" },
      ],
    },
    query_table: { where: "1=1", outFields: ["NAME_2"], returnGeometry: false },
  }) as unknown as ResourceFeature;

const COUNTRIES = resource("Political_administrative_division_of_order_0", "2");
const STATES = resource("Political_administrative_division_of_order_1", "4");
const MUNICIPALITIES = resource("Political_administrative_division_of_order_2", "6");
const CAPITALS = resource("Administrative_capitals_at_admin_0_to_2_levels", "9");
const PROTECTED_AREAS = resource("Protected_areas", "0");

const layerUrl = (r: ResourceFeature) => r.url + r.layer_id;

const GEOMETRY = { type: "polygon" } as __esri.Polygon;
const PANDO: AdminUnit = { level: 1, gid0: "BOL", name1: "Pando" };

beforeEach(() => {
  queries.length = 0;
  layerRows = {
    [layerUrl(COUNTRIES)]: [{ FID: 1, GID_0: "BOL" }],
    [layerUrl(STATES)]: [
      { FID: 10, GID_0: "BOL", NAME_1: "Pando" },
      { FID: 11, GID_0: "BOL", NAME_1: "La Paz" },
    ],
    [layerUrl(MUNICIPALITIES)]: [
      { FID: 20, GID_0: "BOL", NAME_1: "Pando", NAME_2: "Abuná" },
      { FID: 21, GID_0: "BOL", NAME_1: "Pando", NAME_2: "Federico Román" },
      { FID: 22, GID_0: "BOL", NAME_1: "La Paz", NAME_2: "Abel Iturralde" },
    ],
    [layerUrl(CAPITALS)]: [
      { FID: 30, ISO: "BOL", NAME_1: "Pando", NAME_2: "Federico Roman" },
      { FID: 31, ISO: "BOL", NAME_1: "Beni", NAME_2: "Cercado" },
    ],
  };
});

const lastQuery = () => queries.at(-1)!.query;

// Each test uses its own unit so the module's object-id cache never answers for another test.
describe("getQueryFeatureId for an administrative unit", () => {
  it("filters by the nesting instead of the shape", async () => {
    await getQueryFeatureId({
      id: 4,
      type: "numeric",
      resource: MUNICIPALITIES,
      geometry: GEOMETRY,
      adminUnit: PANDO,
    });

    expect(queries[0].query).toMatchObject({ where: "GID_0 = 'BOL'", returnGeometry: false });
    expect(lastQuery().objectIds).toEqual([20, 21]);
    expect(lastQuery().geometry).toBeUndefined();
  });

  it("counts Pando's one country", async () => {
    await getQueryFeatureId({
      id: 2,
      type: "numeric",
      resource: COUNTRIES,
      geometry: GEOMETRY,
      adminUnit: { ...PANDO },
    });

    expect(lastQuery().objectIds).toEqual([1]);
  });

  it("matches capitals despite their spelling", async () => {
    await getQueryFeatureId({
      id: 5,
      type: "numeric",
      resource: CAPITALS,
      geometry: GEOMETRY,
      adminUnit: { level: 2, gid0: "BOL", name1: "Pando", name2: "Federico Román" },
    });

    expect(queries[0].query.where).toBe("ISO = 'BOL'");
    expect(lastQuery().objectIds).toEqual([30]);
  });

  it("counts one state when the layer has no shape for the municipality's state", async () => {
    const result = await getQueryFeatureId({
      id: 3,
      type: "numeric",
      resource: STATES,
      geometry: GEOMETRY,
      adminUnit: { level: 2, gid0: "BOL", name1: "Oruro", name2: "Sajama" },
    });

    expect(queries).toHaveLength(1);
    expect(result?.features.map((f) => f.attributes)).toEqual([{ value: 1 }]);
  });

  it("names the missing state when the query isn't a count", async () => {
    const result = await getQueryFeatureId({
      id: 3,
      type: "table",
      resource: { ...STATES, query_table: { where: "1=1", outFields: ["*"] } } as ResourceFeature,
      geometry: GEOMETRY,
      adminUnit: { level: 2, gid0: "BOL", name1: "Oruro", name2: "Turco" },
    });

    expect(result?.features.map((f) => f.attributes)).toEqual([{ GID_0: "BOL", NAME_1: "Oruro" }]);
  });

  it("returns nothing, rather than the whole layer, when no descendant matches", async () => {
    const result = await getQueryFeatureId({
      id: 4,
      type: "numeric",
      resource: MUNICIPALITIES,
      geometry: GEOMETRY,
      adminUnit: { level: 1, gid0: "BOL", name1: "Beni" },
    });

    expect(queries).toHaveLength(1);
    expect(result?.features).toEqual([]);
  });
});

describe("getQueryFeatureId for any other area", () => {
  it("stays spatial for a drawn area", async () => {
    await getQueryFeatureId({
      id: 4,
      type: "numeric",
      resource: MUNICIPALITIES,
      geometry: GEOMETRY,
      adminUnit: null,
    });

    expect(queries).toHaveLength(1);
    expect(lastQuery().geometry).toBe(GEOMETRY);
    expect(lastQuery().objectIds).toBeUndefined();
  });

  it("stays spatial for a layer outside the nesting", async () => {
    await getQueryFeatureId({
      id: 60,
      type: "numeric",
      resource: PROTECTED_AREAS,
      geometry: GEOMETRY,
      adminUnit: { level: 1, gid0: "BOL", name1: "Santa Cruz" },
    });

    expect(queries).toHaveLength(1);
    expect(lastQuery().geometry).toBe(GEOMETRY);
  });
});
