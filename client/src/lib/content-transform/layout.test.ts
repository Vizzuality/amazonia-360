import { toLayout } from "./layout";
import type { DroppedLayoutEntry } from "./layout";

const entry = (indicatorId: number, overrides: Record<string, unknown> = {}) => ({
  id: indicatorId,
  indicator_id: indicatorId,
  type: "numeric",
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  ...overrides,
});

describe("toLayout", () => {
  test("drops the redundant entry id and keeps the geometry", () => {
    expect(
      toLayout({
        entries: [entry(7, { x: 2, y: 1, w: 3, h: 4, type: "chart" })],
        knownIndicatorIds: new Set([7]),
        owner: "Topic 1",
      }),
    ).toEqual([{ indicatorId: 7, type: "chart", x: 2, y: 1, w: 3, h: 4 }]);
  });

  test("removes an entry whose indicator does not exist and records it", () => {
    // Subtopic 26 references Indicator 55, which is not in the catalogue.
    const dropped: DroppedLayoutEntry[] = [];

    const result = toLayout({
      entries: [entry(54), entry(55), entry(56)],
      knownIndicatorIds: new Set([54, 56]),
      owner: "Subtopic 26",
      dropped,
    });

    expect(result.map((e) => e.indicatorId)).toEqual([54, 56]);
    expect(dropped).toEqual([{ owner: "Subtopic 26", indicatorId: 55 }]);
  });

  test("keeps cross-topic references, which are deliberate", () => {
    // The overview Topic pulls Indicators from other Topics. An entry is only
    // removed when its Indicator is genuinely absent.
    const result = toLayout({
      entries: [entry(35), entry(120)],
      knownIndicatorIds: new Set([35, 120]),
      owner: "Topic 0",
    });

    expect(result.map((e) => e.indicatorId)).toEqual([35, 120]);
  });

  test("preserves order", () => {
    const result = toLayout({
      entries: [entry(3), entry(1), entry(2)],
      knownIndicatorIds: new Set([1, 2, 3]),
      owner: "Topic 1",
    });

    expect(result.map((e) => e.indicatorId)).toEqual([3, 1, 2]);
  });

  test("returns an empty layout for missing or non-array input", () => {
    const args = { knownIndicatorIds: new Set([1]), owner: "Topic 1" };
    expect(toLayout({ entries: undefined, ...args })).toEqual([]);
    expect(toLayout({ entries: null, ...args })).toEqual([]);
    expect(toLayout({ entries: "nope", ...args })).toEqual([]);
  });

  test("coerces numeric strings in the geometry", () => {
    const result = toLayout({
      entries: [entry(1, { x: "2", w: "3" })],
      knownIndicatorIds: new Set([1]),
      owner: "Topic 1",
    });

    expect(result[0]).toMatchObject({ x: 2, w: 3 });
  });
});
