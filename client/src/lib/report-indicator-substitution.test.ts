import {
  getIndicatorCounterpartMap,
  getIndicatorSubstitutionMap,
  getSubstitutedIndicatorId,
} from "@/lib/report-indicator-substitution";

import { Indicator } from "@/types/indicator";

const indicator = (over: Partial<Indicator> & Pick<Indicator, "id">): Indicator =>
  ({
    order: 0,
    name: "Indicator",
    subtopic: { id: 0, topic_id: 0, name: "Subtopic" },
    topic: { id: 0, name: "Topic" },
    visualization_types: [],
    resource: { type: "component", name: "total-area" },
    ...over,
  }) as Indicator;

describe("getIndicatorSubstitutionMap", () => {
  it("maps a regional id to the module indicator that replaces it, from a string relationship", () => {
    const indicators = [indicator({ id: 216, replaces: "11" })];

    expect(getIndicatorSubstitutionMap(indicators)).toEqual(new Map([[11, 216]]));
  });

  it("maps a regional id to the module indicator that replaces it, from a populated relationship", () => {
    const populatedReplaces = { id: "14" } as Indicator["replaces"];
    const indicators = [indicator({ id: 208, replaces: populatedReplaces })];

    expect(getIndicatorSubstitutionMap(indicators)).toEqual(new Map([[14, 208]]));
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

    expect(getIndicatorSubstitutionMap(indicators)).toEqual(
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

    expect(getIndicatorSubstitutionMap(indicators)).toEqual(new Map());
  });

  it("leaves out a relationship that resolves to a non-numeric id", () => {
    const indicators = [indicator({ id: 216, replaces: "not-a-content-code" })];

    expect(getIndicatorSubstitutionMap(indicators)).toEqual(new Map());
  });

  it("returns an empty map for the regional catalogue", () => {
    expect(getIndicatorSubstitutionMap([indicator({ id: 11 }), indicator({ id: 14 })])).toEqual(
      new Map(),
    );
  });
});

describe("getSubstitutedIndicatorId", () => {
  it("swaps a regional id for the module's own indicator id", () => {
    const substitutionMap = new Map([[11, 216]]);

    expect(getSubstitutedIndicatorId(11, substitutionMap)).toBe(216);
  });

  it("passes an indicator id through unchanged when it has no substitution", () => {
    const substitutionMap = new Map([[11, 216]]);

    expect(getSubstitutedIndicatorId(35, substitutionMap)).toBe(35);
  });

  it("passes every indicator id through unchanged against an empty map", () => {
    expect(getSubstitutedIndicatorId(11, new Map())).toBe(11);
  });
});

describe("getIndicatorCounterpartMap", () => {
  it("maps a module indicator to the regional one and back", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 216, replaces: { id: "11" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)).toBe(216);
    expect(map.get(216)).toBe(11);
  });

  it("accepts a bare id on replaces, as the CMS returns at depth 0", () => {
    const map = getIndicatorCounterpartMap([indicator({ id: 208, replaces: "14" })]);

    expect(map.get(14)).toBe(208);
    expect(map.get(208)).toBe(14);
  });

  it("keeps the last declaration when two module indicators replace the same regional one", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 216, replaces: { id: "11" } as Indicator["replaces"] }),
      indicator({ id: 300, replaces: { id: "11" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)).toBe(300);
    expect(map.get(216)).toBe(11);
    expect(map.get(300)).toBe(11);
  });

  it("does not resolve a chain transitively", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 300, replaces: { id: "11" } as Indicator["replaces"] }),
      indicator({ id: 400, replaces: { id: "300" } as Indicator["replaces"] }),
    ]);

    expect(map.get(11)).toBe(300);
    expect(map.get(300)).toBe(400);
    expect(map.get(400)).toBe(300);
  });

  it("leaves an indicator that replaces nothing out of the map", () => {
    const map = getIndicatorCounterpartMap([
      indicator({ id: 9 }),
      indicator({ id: 13, replaces: null }),
    ]);

    expect(map.size).toBe(0);
  });
});
