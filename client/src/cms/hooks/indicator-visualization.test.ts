import { describe, expect, test, vi } from "vitest";
import INDICATORS from "@/../datum/indicators.json";

import { findVisualizationMismatches, warnOnVisualizationMismatch } from "./indicator-visualization";

const featureResource = (overrides: Record<string, unknown> = {}) => ({
  blockType: "feature",
  name: "test-layer",
  url: "https://example.test/FeatureServer/",
  layer_id: "0",
  ...overrides,
});

describe("findVisualizationMismatches", () => {
  test("returns nothing when a declared type has a matching query", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: ["numeric"],
        resource: featureResource({ query_numeric: { where: "1=1" } }),
      }),
    ).toEqual([]);
  });

  test("flags a declared type with no matching query", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: ["table"],
        resource: featureResource(),
      }),
    ).toEqual([{ kind: "declared-without-query", type: "table" }]);
  });

  test("flags a query whose type is not declared", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: ["numeric"],
        resource: featureResource({
          query_numeric: { where: "1=1" },
          query_chart: { where: "1=1" },
        }),
      }),
    ).toEqual([{ kind: "query-without-declared", type: "chart" }]);
  });

  test("ignores `map`, which has no corresponding query field", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: ["map"],
        resource: featureResource(),
      }),
    ).toEqual([]);
  });

  test("ignores imagery: its numerics come from histograms, not a query", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: ["map", "numeric"],
        resource: { blockType: "imagery", name: "slope", url: "https://example.test/ImageServer" },
      }),
    ).toEqual([]);
  });

  test("ignores h3 rows, which declare no visualization types", () => {
    expect(
      findVisualizationMismatches({
        visualization_types: [],
        resource: { blockType: "h3", name: "altitude", column: "ALTMEAN" },
      }),
    ).toEqual([]);
  });

  test("tolerates missing and malformed input without throwing", () => {
    expect(findVisualizationMismatches({})).toEqual([]);
    expect(findVisualizationMismatches({ visualization_types: null, resource: null })).toEqual([]);
    expect(findVisualizationMismatches({ visualization_types: "map", resource: 42 })).toEqual([]);
  });
});

describe("findVisualizationMismatches against the real source data", () => {
  test("flags exactly one row across all 164 indicators: indicator 5", () => {
    const flagged = (
      INDICATORS as unknown as {
        id: number;
        visualization_types: string[];
        resource: Record<string, unknown>;
      }[]
    )
      .map((indicator) => ({
        id: indicator.id,
        mismatches: findVisualizationMismatches({
          visualization_types: indicator.visualization_types,
          // The source JSON uses `type`; Payload blocks use `blockType`.
          resource: { ...indicator.resource, blockType: indicator.resource.type },
        }),
      }))
      .filter(({ mismatches }) => mismatches.length > 0);

    expect(flagged).toEqual([
      { id: 5, mismatches: [{ kind: "query-without-declared", type: "chart" }] },
    ]);
  });
});

describe("warnOnVisualizationMismatch", () => {
  test("logs a warning for a mismatch on Payload-shaped input (resource as array)", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["map"],
      resource: [
        {
          blockType: "feature",
          name: "test-layer",
          url: "https://example.test/FeatureServer/",
          query_chart: { where: "1=1" },
        },
      ],
      legacy_id: 42,
    };

    const result = warnOnVisualizationMismatch({ req, data } as never);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      'Indicator 42 has a query_chart but does not declare "chart". The widget may render empty.',
    );
    expect(result).toEqual(data);
  });

  test("handles non-array resource (bare object)", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["table"],
      resource: {
        blockType: "feature",
        name: "test-layer",
        url: "https://example.test/FeatureServer/",
      },
      legacy_id: 5,
    };

    const result = warnOnVisualizationMismatch({ req, data } as never);

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      'Indicator 5 declares "table" but has no query_table. The widget may render empty.',
    );
    expect(result).toEqual(data);
  });

  test("does not log a warning when there are no mismatches", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["numeric"],
      resource: {
        blockType: "feature",
        name: "test-layer",
        url: "https://example.test/FeatureServer/",
        query_numeric: { where: "1=1" },
      },
      legacy_id: 10,
    };

    const result = warnOnVisualizationMismatch({ req, data } as never);

    expect(warn).not.toHaveBeenCalled();
    expect(result).toEqual(data);
  });

  test("returns data unchanged on the non-warning path", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["map"],
      resource: { blockType: "imagery", name: "slope" },
    };

    const result = warnOnVisualizationMismatch({ req, data } as never);

    expect(result).toBe(data);
  });

  test("uses legacy_id fallback when legacy_id is absent", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["chart"],
      resource: {
        blockType: "feature",
        name: "test-layer",
        url: "https://example.test/FeatureServer/",
      },
    };

    warnOnVisualizationMismatch({ req, data } as never);

    expect(warn).toHaveBeenCalledWith(
      'Indicator (new) declares "chart" but has no query_chart. The widget may render empty.',
    );
  });

  test("logs multiple warnings for multiple mismatches", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["numeric", "table"],
      resource: [
        {
          blockType: "feature",
          name: "test-layer",
          url: "https://example.test/FeatureServer/",
        },
      ],
      legacy_id: 99,
    };

    warnOnVisualizationMismatch({ req, data } as never);

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenNthCalledWith(
      1,
      'Indicator 99 declares "numeric" but has no query_numeric. The widget may render empty.',
    );
    expect(warn).toHaveBeenNthCalledWith(
      2,
      'Indicator 99 declares "table" but has no query_table. The widget may render empty.',
    );
  });

  test("returns data unchanged when warnings are logged", () => {
    const warn = vi.fn();
    const req = { payload: { logger: { warn } } } as never;
    const data = {
      visualization_types: ["table"],
      resource: {
        blockType: "feature",
        name: "test-layer",
        url: "https://example.test/FeatureServer/",
      },
      legacy_id: 7,
    };

    const result = warnOnVisualizationMismatch({ req, data } as never);

    expect(result).toBe(data);
  });
});
