import { describe, expect, it } from "vitest";

import { mapDefaultVisualization } from "./map-default-visualization";
import { rawSubtopics, rawTopics, type RawDefaultVisualization } from "./source";

const entry = (over: Partial<RawDefaultVisualization> = {}): RawDefaultVisualization => ({
  id: 1,
  indicator_id: 3,
  type: "map",
  x: 0,
  y: 0,
  w: 2,
  h: 4,
  ...over,
});

describe("mapDefaultVisualization", () => {
  it("maps geometry verbatim and resolves the indicator to its uuid", () => {
    const ids = new Map([[3, "uuid-3"]]);
    const { entries, skipped } = mapDefaultVisualization([entry()], 1, ids);

    expect(skipped).toEqual([]);
    expect(entries).toEqual([{ indicator: "uuid-3", type: "map", x: 0, y: 0, w: 2, h: 4 }]);
  });

  it("leaves basemapId and opacity unset so field defaults apply", () => {
    const { entries } = mapDefaultVisualization([entry()], 1, new Map([[3, "uuid-3"]]));
    expect(entries[0]).not.toHaveProperty("basemapId");
    expect(entries[0]).not.toHaveProperty("opacity");
  });

  it("applies fix 1 for subtopic 26 and keeps the original geometry", () => {
    const ids = new Map([[146, "uuid-146"]]);
    const { entries, skipped } = mapDefaultVisualization(
      [entry({ id: 55, indicator_id: 55 })],
      26,
      ids,
    );

    expect(skipped).toEqual([]);
    expect(entries).toEqual([{ indicator: "uuid-146", type: "map", x: 0, y: 0, w: 2, h: 4 }]);
  });

  it("skips an unresolvable indicator instead of throwing", () => {
    const { entries, skipped } = mapDefaultVisualization(
      [entry({ indicator_id: 999 })],
      1,
      new Map(),
    );

    expect(entries).toEqual([]);
    expect(skipped).toEqual([999]);
  });

  it("returns an empty result for a row with no default_visualization", () => {
    expect(mapDefaultVisualization(undefined, 1, new Map())).toEqual({
      entries: [],
      skipped: [],
    });
  });

  it("resolves every entry in the real source once fix 1 is applied", () => {
    const ids = new Map(
      // every indicator legacy_id that exists, plus none that do not
      [
        ...new Set([
          146,
          ...rawTopics.flatMap((t) => t.default_visualization ?? []).map((e) => e.indicator_id),
        ]),
      ].map((id) => [id, `uuid-${id}`] as const),
    );
    const topicSkips = rawTopics.flatMap(
      (t) => mapDefaultVisualization(t.default_visualization, t.id, ids).skipped,
    );
    expect(topicSkips).toEqual([]);

    const subtopicIds = new Map(
      [
        ...new Set([
          146,
          ...rawSubtopics
            .flatMap((s) => s.default_visualization ?? [])
            .map((e) => e.indicator_id)
            .filter((id) => id !== 55),
        ]),
      ].map((id) => [id, `uuid-${id}`] as const),
    );
    const subtopicSkips = rawSubtopics.flatMap(
      (s) => mapDefaultVisualization(s.default_visualization, s.id, subtopicIds).skipped,
    );
    expect(subtopicSkips).toEqual([]);
  });
});
