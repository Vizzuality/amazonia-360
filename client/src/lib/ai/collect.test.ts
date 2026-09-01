import { Indicator, ImageryAggregation } from "@/types/indicator";

import { collectTopicEvidence, EvidenceQueries } from "./collect";

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
  ({
    id,
    name: `H3 ${id}`,
    resource: { type: "h3", name: "ALTMEAN", column: "ALTMEAN" },
  }) as unknown as Indicator;

const featureSet = (attributes: Record<string, unknown>[]) =>
  ({ features: attributes.map((a) => ({ attributes: a })) }) as unknown as __esri.FeatureSet;

const imageryData = (counts: number[], statistics?: Partial<__esri.RasterBandStatistics>) => ({
  histograms: [{ min: 0, max: 10, size: counts.length, counts }] as __esri.RasterHistogram[],
  statistics: [{ min: 0, max: 10, ...statistics }] as __esri.RasterBandStatistics[],
});

const queries = (overrides: Partial<EvidenceQueries> = {}): EvidenceQueries => ({
  queryFeature: vi.fn().mockResolvedValue(featureSet([{ label: "A", value: 5, total: 10 }])),
  queryImagery: vi.fn().mockResolvedValue(imageryData([4, 6], { sum: 42 })),
  ...overrides,
});

describe("collectTopicEvidence", () => {
  test("asks feature indicators for query_ai, not query_chart", async () => {
    const deps = queries();

    await collectTopicEvidence({ indicators: [featureIndicator(1)], geometry: null }, deps);

    expect(deps.queryFeature).toHaveBeenCalledWith(expect.objectContaining({ id: 1, type: "ai" }));
  });

  test("reports ok with compacted feature evidence", async () => {
    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(1)], geometry: null },
      queries(),
    );

    expect(result.indicators).toEqual([
      {
        id: 1,
        name: "Feature 1",
        unit: "km²",
        status: "ok",
        evidence: {
          feature_count: 1,
          area_km2: 5,
          area_share: 50,
          classes: [{ label: "A", feature_count: 1, area_km2: 5, percentage: 50 }],
        },
      },
    ]);
    expect(result).toMatchObject({ included: 1, total: 1 });
  });

  test("reports unavailable, not no_coverage, when the indicator defines no query_ai", async () => {
    const deps = queries();

    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(60, "")], geometry: null },
      deps,
    );

    expect(result.indicators[0]).toMatchObject({ id: 60, status: "unavailable" });
    expect(result.indicators[0].evidence).toBeUndefined();
    expect(deps.queryFeature).not.toHaveBeenCalled();
    expect(result).toMatchObject({ included: 0, total: 1 });
  });

  test("reports no_coverage when a feature query returns nothing in the area", async () => {
    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(1)], geometry: null },
      queries({ queryFeature: vi.fn().mockResolvedValue(featureSet([])) }),
    );

    expect(result.indicators[0]).toMatchObject({ status: "no_coverage" });
    expect(result).toMatchObject({ included: 1, total: 1 });
  });

  test("reports unavailable when a feature service rejects", async () => {
    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(1)], geometry: null },
      queries({ queryFeature: vi.fn().mockRejectedValue(new Error("503")) }),
    );

    expect(result.indicators[0]).toMatchObject({ status: "unavailable" });
  });

  test("reports unavailable when a feature service returns null", async () => {
    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(1)], geometry: null },
      queries({ queryFeature: vi.fn().mockResolvedValue(null) }),
    );

    expect(result.indicators[0]).toMatchObject({ status: "unavailable" });
  });

  test("includes imagery indicators with a scalar and a class distribution", async () => {
    const result = await collectTopicEvidence(
      { indicators: [imageryIndicator(35)], geometry: null },
      queries(),
    );

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
    const result = await collectTopicEvidence(
      { indicators: [imageryIndicator(13, "none")], geometry: null },
      queries(),
    );

    expect(result.indicators[0].evidence).toMatchObject({ aggregation: "none", value: null });
  });

  test("reports no_coverage when the area holds no pixels", async () => {
    const result = await collectTopicEvidence(
      { indicators: [imageryIndicator(35)], geometry: null },
      queries({ queryImagery: vi.fn().mockResolvedValue(imageryData([0, 0])) }),
    );

    expect(result.indicators[0]).toMatchObject({ status: "no_coverage" });
  });

  test("reports unavailable when an imagery service fails", async () => {
    const result = await collectTopicEvidence(
      { indicators: [imageryIndicator(35)], geometry: null },
      queries({ queryImagery: vi.fn().mockRejectedValue(new Error("boom")) }),
    );

    expect(result.indicators[0]).toMatchObject({ status: "unavailable" });
  });

  test("times out a hanging service as unavailable without losing its siblings", async () => {
    vi.useFakeTimers();

    try {
      const pending = collectTopicEvidence(
        { indicators: [featureIndicator(1), featureIndicator(2)], geometry: null, timeoutMs: 100 },
        queries({
          queryFeature: vi
            .fn()
            .mockImplementationOnce(() => new Promise(() => {}))
            .mockResolvedValueOnce(featureSet([{ OBJECTID: 1 }])),
        }),
      );

      await vi.advanceTimersByTimeAsync(150);
      const result = await pending;

      expect(result.indicators.map((i) => [i.id, i.status])).toEqual([
        [1, "unavailable"],
        [2, "ok"],
      ]);
      expect(result).toMatchObject({ included: 1, total: 2 });
    } finally {
      vi.useRealTimers();
    }
  });

  test("marks h3 not_supported and keeps it out of the N of M count", async () => {
    const result = await collectTopicEvidence(
      { indicators: [featureIndicator(1), h3Indicator(90), h3Indicator(91)], geometry: null },
      queries(),
    );

    expect(result.indicators.map((i) => i.status)).toEqual([
      "ok",
      "not_supported",
      "not_supported",
    ]);
    expect(result).toMatchObject({ included: 1, total: 1 });
  });
});
