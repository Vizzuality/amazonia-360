import { getQueryFeatureId, getQueryImageryId } from "@/lib/indicators";

import { ImageryAggregation, Indicator } from "@/types/indicator";

import { getTopicEvidence, getFeatureEvidence } from "./ai";

vi.mock("@/lib/indicators", () => ({
  getIndicators: vi.fn(),
  getQueryFeatureId: vi.fn(),
  getQueryImageryId: vi.fn(),
}));

vi.mock("@/types/generated/text-generation", () => ({
  generateDescriptionTextAiPost: vi.fn(),
}));

const GEOMETRY = {} as __esri.Polygon;
const QUERY = { where: "1=1", returnIntersections: true, outFields: ["*"] };

const featureIndicator = (id: number, query_ai: unknown = QUERY): Indicator =>
  ({
    id,
    name: `Feature ${id}`,
    unit: "km²",
    resource: { type: "feature", url: "https://example.test/", layer_id: 0, query_ai },
  }) as unknown as Indicator;

const imageryIndicator = (id: number, aggregation: ImageryAggregation = "sum"): Indicator =>
  ({
    id,
    name: `Imagery ${id}`,
    resource: {
      type: "imagery",
      url: "https://example.test/ImageServer",
      aggregation,
      legend: {
        type: "basic",
        items: [
          { id: 0, label: "< 5", color: "#000" },
          { id: 1, label: "> 5", color: "#fff" },
        ],
      },
      rasterFunction: { functionName: "Colormap", functionArguments: { colormap: [[1], [2]] } },
    },
  }) as unknown as Indicator;

const h3Indicator = (id: number): Indicator =>
  ({ id, name: `H3 ${id}`, resource: { type: "h3", name: "ALTMEAN" } }) as unknown as Indicator;

const featureSet = (attributes: Record<string, unknown>[]) =>
  ({ features: attributes.map((a) => ({ attributes: a })) }) as unknown as __esri.FeatureSet;

const imageryData = (counts: number[], statistics?: Partial<__esri.RasterBandStatistics>) => ({
  histograms: [{ min: 0, max: 10, size: counts.length, counts }] as __esri.RasterHistogram[],
  statistics: [{ min: 0, max: 10, ...statistics }] as __esri.RasterBandStatistics[],
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getQueryFeatureId).mockResolvedValue(featureSet([{ label: "A", value: 5, total: 10 }]));
  vi.mocked(getQueryImageryId).mockResolvedValue(imageryData([4, 6], { sum: 42 }));
});

describe("getTopicEvidence", () => {
  test("asks feature indicators for query_ai, not query_chart", async () => {
    await getTopicEvidence([featureIndicator(1)], GEOMETRY);

    expect(getQueryFeatureId).toHaveBeenCalledWith(expect.objectContaining({ id: 1, type: "ai" }));
  });

  test("reports ok with compacted feature evidence", async () => {
    const result = await getTopicEvidence([featureIndicator(1)], GEOMETRY);

    expect(result.indicators).toEqual([
      {
        id: 1,
        name: "Feature 1",
        unit: "km²",
        status: "ok",
        evidence: expect.objectContaining({ feature_count: 1, area_km2: 5, area_share: 50 }),
      },
    ]);
    expect(result).toMatchObject({ included: 1, total: 1 });
  });

  test("measures nothing without an analysis area", async () => {
    const result = await getTopicEvidence([featureIndicator(1), imageryIndicator(35)], null);

    expect(result).toEqual({ indicators: [], included: 0, total: 0 });
    expect(getQueryFeatureId).not.toHaveBeenCalled();
    expect(getQueryImageryId).not.toHaveBeenCalled();
  });

  test("reports unavailable, without querying, when the indicator defines no query_ai", async () => {
    const result = await getTopicEvidence([featureIndicator(60, "")], GEOMETRY);

    expect(result.indicators[0]).toMatchObject({ id: 60, status: "unavailable" });
    expect(result.indicators[0].evidence).toBeUndefined();
    expect(getQueryFeatureId).not.toHaveBeenCalled();
    expect(result).toMatchObject({ included: 0, total: 1 });
  });

  test("reports no_coverage when a feature query returns nothing in the area", async () => {
    vi.mocked(getQueryFeatureId).mockResolvedValue(featureSet([]));

    const result = await getTopicEvidence([featureIndicator(1)], GEOMETRY);

    expect(result.indicators[0]).toMatchObject({ status: "no_coverage" });
    expect(result).toMatchObject({ included: 1, total: 1 });
  });

  test.each([
    ["rejects", () => vi.mocked(getQueryFeatureId).mockRejectedValue(new Error("503"))],
    ["returns null", () => vi.mocked(getQueryFeatureId).mockResolvedValue(null)],
  ])("reports unavailable when a feature service %s", async (_, arrange) => {
    arrange();

    const result = await getTopicEvidence([featureIndicator(1)], GEOMETRY);

    expect(result.indicators[0]).toMatchObject({ status: "unavailable" });
  });

  test("includes imagery indicators with a scalar and a class distribution", async () => {
    const result = await getTopicEvidence([imageryIndicator(35)], GEOMETRY);

    expect(result.indicators).toEqual([
      {
        id: 35,
        name: "Imagery 35",
        status: "ok",
        evidence: {
          aggregation: "sum",
          value: 42,
          distribution: [
            { label: "< 5", percentage: 40 },
            { label: "> 5", percentage: 60 },
          ],
        },
      },
    ]);
  });

  test("gives a categorical imagery indicator a distribution but no scalar", async () => {
    const result = await getTopicEvidence([imageryIndicator(13, "none")], GEOMETRY);

    expect(result.indicators[0].evidence).toMatchObject({ aggregation: "none", value: null });
  });

  test("reports no_coverage when the area holds no pixels", async () => {
    vi.mocked(getQueryImageryId).mockResolvedValue(imageryData([0, 0]));

    const result = await getTopicEvidence([imageryIndicator(35)], GEOMETRY);

    expect(result.indicators[0]).toMatchObject({ status: "no_coverage" });
  });

  test("reports unavailable when an imagery service fails", async () => {
    vi.mocked(getQueryImageryId).mockRejectedValue(new Error("boom"));

    const result = await getTopicEvidence([imageryIndicator(35)], GEOMETRY);

    expect(result.indicators[0]).toMatchObject({ status: "unavailable" });
  });

  test("marks h3 not_supported and keeps it out of the N of M count", async () => {
    const result = await getTopicEvidence(
      [featureIndicator(1), h3Indicator(90), h3Indicator(91)],
      GEOMETRY,
    );

    expect(result.indicators.map((i) => i.status)).toEqual([
      "ok",
      "not_supported",
      "not_supported",
    ]);
    expect(result).toMatchObject({ included: 1, total: 1 });
  });

  test("one failing service does not take the topic down with it", async () => {
    vi.mocked(getQueryFeatureId)
      .mockRejectedValueOnce(new Error("503"))
      .mockResolvedValueOnce(featureSet([{ OBJECTID: 1 }]));

    const result = await getTopicEvidence([featureIndicator(1), featureIndicator(2)], GEOMETRY);

    expect(result.indicators.map((i) => [i.id, i.status])).toEqual([
      [1, "unavailable"],
      [2, "ok"],
    ]);
    expect(result).toMatchObject({ included: 1, total: 2 });
  });
});

describe("getFeatureEvidence", () => {
  test("counts features and keeps nothing else when the query returns no values", () => {
    expect(
      getFeatureEvidence([{ attributes: { OBJECTID: 1 } }, { attributes: { OBJECTID: 2 } }]),
    ).toEqual({ feature_count: 2 });
  });

  test("sums intersection areas and reports them as a share of the analysis area", () => {
    const evidence = getFeatureEvidence([
      { attributes: { label: "Protected", value: 30, total: 200 } },
      { attributes: { label: "Protected", value: 10, total: 200 } },
      { attributes: { label: "Indigenous", value: 60, total: 200 } },
    ]);

    expect(evidence).toEqual({
      feature_count: 3,
      area_km2: 100,
      area_share: 50,
      classes: [
        { label: "Indigenous", feature_count: 1, area_km2: 60, percentage: 30 },
        { label: "Protected", feature_count: 2, area_km2: 40, percentage: 20 },
      ],
    });
  });

  test("names the features when the layer is a list of named things", () => {
    const evidence = getFeatureEvidence([
      { attributes: { NAME: "Amazon Sustainable Landscapes", OBJECTID: 1 } },
      { attributes: { nombre: "Programa Bioeconomía", OBJECTID: 2 } },
    ]);

    expect(evidence).toEqual({
      feature_count: 2,
      classes: [
        { label: "Amazon Sustainable Landscapes", feature_count: 1 },
        { label: "Programa Bioeconomía", feature_count: 1 },
      ],
    });
  });

  test("prefers an explicit label over a name", () => {
    const evidence = getFeatureEvidence([{ attributes: { NAME: "Ignored", label: "Wetlands" } }]);

    expect(evidence.classes).toEqual([{ label: "Wetlands", feature_count: 1 }]);
  });

  test("caps the class list and says so", () => {
    const evidence = getFeatureEvidence(
      Array.from({ length: 20 }, (_, index) => ({
        attributes: { label: `Class ${index}`, value: index + 1, total: 1000 },
      })),
    );

    expect(evidence.classes).toHaveLength(15);
    expect(evidence.classes_truncated).toBe(true);
    // Ranked by area, so the largest class survives the cap.
    expect(evidence.classes?.[0]).toMatchObject({ label: "Class 19", area_km2: 20 });
  });
});
