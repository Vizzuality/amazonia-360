import {
  getIndicatorCounterpart,
  getIndicatorCounterpartMap,
  getIndicatorSubstitutionMap,
  getSubstitutedIndicatorId,
} from "@/lib/indicators/substitution";

import { Indicator } from "@/types/indicator";

const indicator = (over: Partial<Indicator> & Pick<Indicator, "id">): Indicator =>
  ({
    order: 0,
    name: "Indicator",
    subtopic: { id: 0, topic_id: 0, name: "Subtopic" },
    topic: { id: 0, name: "Topic" },
    visualization_types: ["map", "table", "numeric", "chart"],
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

const ids = (map: Map<number, Indicator>) =>
  new Map([...map].map(([key, value]) => [key, value.id]));

describe("getIndicatorSubstitutionMap", () => {
  it("maps a regional id to the module indicator that replaces it, from a string relationship", () => {
    const indicators = [indicator({ id: 216, replaces: "11" })];

    expect(ids(getIndicatorSubstitutionMap(indicators))).toEqual(new Map([[11, 216]]));
  });

  it("maps a regional id to the module indicator that replaces it, from a populated relationship", () => {
    const populatedReplaces = { id: "14" } as Indicator["replaces"];
    const indicators = [indicator({ id: 208, replaces: populatedReplaces })];

    expect(ids(getIndicatorSubstitutionMap(indicators))).toEqual(new Map([[14, 208]]));
  });

  it("builds all four reachable Ecuador substitutions from a mixed catalogue read", () => {
    const indicators = [
      indicator({ id: 11 }),
      indicator({ id: 14 }),
      indicator({ id: 17 }),
      indicator({ id: 18 }),
      indicator({ id: 216, replaces: "11" }),
      indicator({ id: 208, replaces: "14" }),
      indicator({ id: 219, replaces: "17" }),
      indicator({ id: 210, replaces: "18" }),
    ];

    expect(ids(getIndicatorSubstitutionMap(indicators))).toEqual(
      new Map([
        [11, 216],
        [14, 208],
        [17, 219],
        [18, 210],
      ]),
    );
  });

  it("leaves out indicators that replace nothing", () => {
    const indicators = [indicator({ id: 11 }), indicator({ id: 216, replaces: null })];

    expect(getIndicatorSubstitutionMap(indicators).size).toBe(0);
  });

  it("leaves out a relationship that resolves to a non-numeric id", () => {
    const indicators = [indicator({ id: 216, replaces: "not-a-content-code" })];

    expect(getIndicatorSubstitutionMap(indicators).size).toBe(0);
  });

  it("returns an empty map for the regional catalogue", () => {
    expect(getIndicatorSubstitutionMap([indicator({ id: 11 }), indicator({ id: 14 })]).size).toBe(
      0,
    );
  });
});

describe("getSubstitutedIndicatorId", () => {
  const substitutionMap = getIndicatorSubstitutionMap([
    indicator({ id: 216, replaces: "11", visualization_types: ["map", "chart"] }),
  ]);

  it("swaps a regional id for the module's own indicator id", () => {
    expect(getSubstitutedIndicatorId(11, "chart", substitutionMap)).toBe(216);
  });

  it("keeps the regional id when the replacement does not offer the widget's type", () => {
    expect(getSubstitutedIndicatorId(11, "numeric", substitutionMap)).toBe(11);
  });

  it("passes an indicator id through unchanged when it has no substitution", () => {
    expect(getSubstitutedIndicatorId(35, "map", substitutionMap)).toBe(35);
  });

  it("passes every indicator id through unchanged against an empty map", () => {
    expect(getSubstitutedIndicatorId(11, "map", new Map())).toBe(11);
  });
});

describe("getIndicatorCounterpartMap", () => {
  it("maps a module indicator to the regional one and back", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 11 }),
      indicator({ id: 216, replaces: { id: "11" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)?.id).toBe(216);
    expect(map.get(216)?.id).toBe(11);
  });

  it("accepts a bare id on replaces, as the CMS returns at depth 0", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 14 }),
      indicator({ id: 208, replaces: "14" }),
    ]);

    expect(map.get(14)?.id).toBe(208);
    expect(map.get(208)?.id).toBe(14);
  });

  it("keeps the last declaration when two module indicators replace the same regional one", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 11 }),
      indicator({ id: 216, replaces: { id: "11" } as Indicator["replaces"] }),
      indicator({ id: 300, replaces: { id: "11" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)?.id).toBe(300);
    expect(map.get(216)?.id).toBe(11);
    expect(map.get(300)?.id).toBe(11);
  });

  it("does not resolve a chain transitively", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 11 }),
      indicator({ id: 300, replaces: { id: "11" } as Indicator["replaces"] }),
      indicator({ id: 400, replaces: { id: "300" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)?.id).toBe(300);
    expect(map.get(300)?.id).toBe(400);
    expect(map.get(400)?.id).toBe(300);
  });

  it("leaves out a pair whose regional indicator is not in the catalogue read", () => {
    const map = getIndicatorCounterpartMap([indicator({ id: 216, replaces: "11" })]);

    expect(map.size).toBe(0);
  });

  it("leaves an indicator that replaces nothing out of the map", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 9 }),
      indicator({ id: 13, replaces: null }),
    ]);

    expect(map.size).toBe(0);
  });
});

describe("getIndicatorCounterpart", () => {
  const counterparts = getIndicatorCounterpartMap([
    indicator({ id: 17, visualization_types: ["map", "numeric", "chart"] }),
    indicator({
      id: 219,
      replaces: "17",
      visualization_types: ["map", "table", "numeric", "chart"],
    }),
  ]);

  it("returns the counterpart when it offers the widget's type, in both directions", () => {
    expect(getIndicatorCounterpart(17, "chart", counterparts)?.id).toBe(219);
    expect(getIndicatorCounterpart(219, "numeric", counterparts)?.id).toBe(17);
  });

  it("returns null when the counterpart does not offer the widget's type", () => {
    expect(getIndicatorCounterpart(219, "table", counterparts)).toBeNull();
  });

  it("returns null for an indicator with no counterpart", () => {
    expect(getIndicatorCounterpart(35, "map", counterparts)).toBeNull();
  });
});
