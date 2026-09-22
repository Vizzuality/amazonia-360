import { vi } from "vitest";

import {
  Indicator as CmsIndicator,
  Subtopic as CmsSubtopic,
  Topic as CmsTopic,
} from "@/payload-types";

const mockFind = vi.fn();

vi.mock("@/services/sdk", () => ({
  sdk: { find: (...args: unknown[]) => mockFind(...args) },
}));

const { fetchIndicators, fetchSubtopics, fetchTopics } = await import("./index");

/**
 * Records are built, not recorded, and typed as the collection they stand for: add a required
 * field to a collection and these stop compiling, which is the alarm a recorded JSON response
 * cannot raise. Only the fields this boundary reads carry meaningful values.
 */
const TIMESTAMPS = { createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

const topic = (over: Partial<CmsTopic> & Pick<CmsTopic, "id">): CmsTopic => ({
  name: "Geographic context",
  ...TIMESTAMPS,
  ...over,
});

const subtopic = (over: Partial<CmsSubtopic> & Pick<CmsSubtopic, "id">): CmsSubtopic => ({
  name: "ACU",
  topic: "0",
  ...TIMESTAMPS,
  ...over,
});

const indicator = (over: Partial<CmsIndicator> & Pick<CmsIndicator, "id">): CmsIndicator => ({
  order: 0,
  name: "Total area",
  description_short: "The area of the selection",
  // Populated, as `depth: 2` asks for: the boundary reads the Topic through the Subtopic.
  subtopic: subtopic({ id: "0", topic: topic({ id: "0" }) }),
  resource: [{ blockType: "component", name: "total-area" }],
  ...TIMESTAMPS,
  ...over,
});

// Ascending, and spaced so a lexicographic sort would answer 0, 10, 2 — the varchar order the
// CMS itself would give back if this boundary ever asked it to sort.
const TOPICS = [
  topic({
    id: "0",
    default_visualization: [
      { indicator: "0", type: "numeric", x: 0, y: 0, w: 1, h: 1 },
      { indicator: "5", type: "map", x: 1, y: 0, w: 2, h: 2, basemapId: "gray-vector", opacity: 1 },
    ],
  }),
  topic({ id: "2", name: "Population" }),
  topic({ id: "10", name: "Biodiversity" }),
];

const SUBTOPICS = [
  subtopic({ id: "0" }),
  subtopic({ id: "2", name: "Protected areas" }),
  subtopic({ id: "10", name: "Deforestation" }),
];

const INDICATORS = [
  indicator({ id: "0", visualization_types: ["numeric"] }),
  indicator({
    id: "1",
    name: "Municipalities",
    resource: [{ blockType: "feature", url: "https://arcgis/1", layer_id: "0" }],
  }),
  indicator({
    id: "5",
    name: "States",
    resource: [
      {
        blockType: "feature",
        url: "https://arcgis/5",
        layer_id: "0",
        popupTemplate: {
          title: "{NOMBCAP}",
          fieldInfos: [
            { fieldName: "NAME_1", label: "State" },
            { fieldName: "NAME_0", label: "Country" },
          ],
        },
      },
    ],
  }),
  indicator({
    id: "7",
    name: "Rivers",
    resource: [
      {
        blockType: "feature",
        url: "https://arcgis/7",
        layer_id: "0",
        popupTemplate: { title: "{NAME}", fieldInfos: [] },
      },
    ],
  }),
];

type Args = Record<string, unknown>;

const returning = (docs: CmsTopic[] | CmsSubtopic[] | CmsIndicator[]) => {
  mockFind.mockReset();
  mockFind.mockResolvedValue({ docs });
  return () => mockFind.mock.calls[0]?.[0] as Args;
};

describe("the catalogue reads", () => {
  // The three reads share one `read()` helper, so one collection covers the guard.
  test("disable pagination, which is the whole of the truncation guard", async () => {
    const args = returning(TOPICS);

    await fetchTopics({ locale: "en" });

    expect(args()).toMatchObject({ collection: "topics", pagination: false });
  });

  test("ask for the requested locale and fall back to English", async () => {
    const args = returning(TOPICS);

    await fetchTopics({ locale: "es" });

    expect(args()).toMatchObject({ locale: "es", fallbackLocale: "en" });
  });

  test("read topics and subtopics flat: depth 0 already returns the id the app wants", async () => {
    const topics = returning(TOPICS);
    await fetchTopics({ locale: "en" });
    // Explicit, not inherited: the config default is 2 and would make these reads expensive.
    expect(topics()).toMatchObject({ depth: 0 });

    const subtopics = returning(SUBTOPICS);
    await fetchSubtopics({ locale: "en" });
    expect(subtopics()).toMatchObject({ depth: 0 });
  });

  test("reach an indicator's Topic through its Subtopic, trimming what they drag along", async () => {
    const args = returning(INDICATORS);

    await fetchIndicators({ locale: "en" });

    expect(args()).toMatchObject({
      depth: 2,
      populate: {
        subtopics: { name: true, topic: true },
        topics: { name: true },
      },
    });
  });

  // Temporary, and the reason it is asserted: the country rows are seeded and published, so
  // this `where` is the only thing keeping them off the screen until there is a module UI.
  test("withhold country-scoped indicators, leaving the regional catalogue alone", async () => {
    const args = returning(INDICATORS);

    await fetchIndicators({ locale: "en" });

    expect(args()).toMatchObject({ where: { country: { exists: false } } });
  });
});

// Indicators are absent: `lib/indicators` sorts them by name, so their id order is never read.
describe("the order the catalogue arrives in", () => {
  test("is by id for topics and subtopics, whatever order the CMS answered in", async () => {
    returning([...TOPICS].reverse());
    expect((await fetchTopics({ locale: "en" })).map(({ id }) => id)).toEqual([0, 2, 10]);

    returning([...SUBTOPICS].reverse());
    expect((await fetchSubtopics({ locale: "en" })).map(({ id }) => id)).toEqual([0, 2, 10]);
  });
});

describe("content ids", () => {
  test("keep the Overview topic at 0 rather than losing it to a falsy check", async () => {
    returning(TOPICS);

    const overview = (await fetchTopics({ locale: "en" })).find(({ id }) => id === 0);

    expect(overview?.name).toBe("Geographic context");
    expect(typeof overview?.id).toBe("number");
  });

  test("are coerced on a default visualization too, since it becomes a saved report", async () => {
    returning(TOPICS);

    const views = (await fetchTopics({ locale: "en" })).find(
      ({ id }) => id === 0,
    )?.default_visualization;

    expect(views?.[0]).toMatchObject({ indicator_id: 0, type: "numeric" });
    expect(typeof views?.[0].indicator_id).toBe("number");
    // basemapId and opacity belong to the map view alone.
    expect(views?.find((view) => view.type === "map")).toMatchObject({
      indicator_id: 5,
      basemapId: "gray-vector",
      opacity: 1,
    });
  });

  test("refuse a non-numeric id rather than resolving to the wrong record", async () => {
    returning([topic({ id: "" })]);

    await expect(fetchTopics({ locale: "en" })).rejects.toThrow(/numeric content id/);
  });
});

describe("the depth each read asks for", () => {
  test("is checked, because no Payload type narrows it", async () => {
    returning([indicator({ id: "0", subtopic: "3" })]);

    await expect(fetchIndicators({ locale: "en" })).rejects.toThrow(/lost its depth/);
  });

  test("is checked in the other direction too, on the flat reads", async () => {
    returning([subtopic({ id: "0", topic: topic({ id: "0" }) })]);

    await expect(fetchSubtopics({ locale: "en" })).rejects.toThrow(/came back populated/);
  });
});

describe("indicators", () => {
  test("hold the Topic beside the Subtopic, where the app expects the two as siblings", async () => {
    returning(INDICATORS);

    const [first] = await fetchIndicators({ locale: "en" });

    expect(first.topic).toEqual({ id: 0, name: "Geographic context" });
    expect(first.subtopic).toMatchObject({ id: 0, topic_id: 0, name: "ACU" });
  });

  test("carry the one resource unwrapped from the block array", async () => {
    returning(INDICATORS);

    const [first] = await fetchIndicators({ locale: "en" });

    expect(first.resource.type).toBe("component");
    expect(Array.isArray(first.resource)).toBe(false);
  });

  test("refuse a row with no resource, which has nothing to draw or measure", async () => {
    returning([indicator({ id: "0", resource: [] })]);

    await expect(fetchIndicators({ locale: "en" })).rejects.toThrow(/has no resource/);
  });

  test("default an absent visualization_types to empty rather than null", async () => {
    returning([indicator({ id: "0", visualization_types: null })]);

    expect((await fetchIndicators({ locale: "en" }))[0].visualization_types).toEqual([]);
  });
});

describe("a feature's popup", () => {
  const popupOf = async (id: number) =>
    (await fetchIndicators({ locale: "en" })).find((found) => found.id === id)?.resource;

  test("is rebuilt as the ArcGIS `content` shape, dropping Payload's row ids", async () => {
    returning(INDICATORS);

    expect(await popupOf(5)).toMatchObject({
      popupTemplate: {
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
      },
    });
  });

  test("keeps a bare title, where an empty `content` would drop the popup instead", async () => {
    returning(INDICATORS);

    expect(await popupOf(7)).toMatchObject({
      popupTemplate: { title: "{NAME}", content: undefined },
    });
  });

  test("is left out entirely when it carries neither a title nor a field", async () => {
    returning(INDICATORS);

    expect(await popupOf(1)).toMatchObject({ popupTemplate: undefined });
  });
});
