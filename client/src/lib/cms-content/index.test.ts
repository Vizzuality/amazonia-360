import { vi } from "vitest";

import INDICATORS_EN from "./__fixtures__/indicators.en.json";
import INDICATORS_ES from "./__fixtures__/indicators.es.json";
import SUBTOPICS_EN from "./__fixtures__/subtopics.en.json";
import SUBTOPICS_ES from "./__fixtures__/subtopics.es.json";
import TOPICS_EN from "./__fixtures__/topics.en.json";
import TOPICS_ES from "./__fixtures__/topics.es.json";

const mockFind = vi.fn();

vi.mock("@/services/sdk", () => ({
  sdk: { find: (...args: unknown[]) => mockFind(...args) },
}));

const { fetchIndicators, fetchSubtopics, fetchTopics } = await import("./index");

type Args = Record<string, unknown>;

const READS = [
  ["topics", fetchTopics, TOPICS_EN],
  ["subtopics", fetchSubtopics, SUBTOPICS_EN],
  ["indicators", fetchIndicators, INDICATORS_EN],
] as const;

const returning = (docs: unknown[]) => {
  mockFind.mockReset();
  mockFind.mockResolvedValue({ docs });
  return () => mockFind.mock.calls[0]?.[0] as Args;
};

describe("the catalogue reads", () => {
  test.each(READS)(
    "%s disables pagination, which is the whole of the truncation guard",
    async (collection, read, docs) => {
      const args = returning(docs as unknown[]);

      await read({ locale: "en" });

      expect(args()).toMatchObject({ collection, pagination: false });
    },
  );

  test.each(READS)(
    "%s never asks the CMS to sort, since varchar ids sort lexicographically",
    async (_collection, read, docs) => {
      const args = returning(docs as unknown[]);

      await read({ locale: "en" });

      expect(args()).not.toHaveProperty("sort");
    },
  );

  test.each(READS.slice(0, 2))(
    "%s is read flat: depth 0 already returns the id the app wants",
    async (_collection, read, docs) => {
      const args = returning(docs as unknown[]);

      await read({ locale: "en" });

      // Explicit, not inherited: the config default is 2 and would make these reads expensive.
      expect(args()).toMatchObject({ depth: 0 });
    },
  );

  test("indicators reach the Topic through the Subtopic, and trim what they drag along", async () => {
    const args = returning(INDICATORS_EN);

    await fetchIndicators({ locale: "en" });

    expect(args()).toMatchObject({
      depth: 2,
      populate: {
        subtopics: { name: true, topic: true },
        topics: { name: true },
      },
    });
  });

  test("asks for the requested locale and falls back to English", async () => {
    const args = returning(TOPICS_ES);

    await fetchTopics({ locale: "es" });

    expect(args()).toMatchObject({ locale: "es", fallbackLocale: "en" });
  });
});

// Indicators are absent: `lib/indicators` sorts them by name, so their id order is never read.
describe("the order the catalogue arrives in", () => {
  // The fixtures are recorded ascending, so only a reversed read can fail this.
  test.each(READS.slice(0, 2))(
    "%s is sorted by id, whatever order the CMS answered in",
    async (_collection, read, docs) => {
      returning([...(docs as unknown[])].reverse());

      const ids = (await read({ locale: "en" })).map(({ id }) => id);

      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    },
  );
});

describe("content ids", () => {
  test("come back as the numbers saved reports and shared URLs hold", async () => {
    returning(TOPICS_EN);

    const topics = await fetchTopics({ locale: "en" });

    expect(topics.every((topic) => typeof topic.id === "number")).toBe(true);
  });

  test("keep the Overview topic at 0 rather than losing it to a falsy check", async () => {
    returning(TOPICS_EN);

    expect((await fetchTopics({ locale: "en" })).find((topic) => topic.id === 0)?.name).toBe(
      "Geographic context",
    );
  });

  test("are coerced on a default visualization too, since it becomes a saved report", async () => {
    returning(TOPICS_EN);

    const view = (await fetchTopics({ locale: "en" })).find((topic) => topic.id === 0)
      ?.default_visualization[0];

    expect(view).toMatchObject({ indicator_id: 0, type: "numeric" });
    expect(typeof view?.indicator_id).toBe("number");
  });

  test("carry a map view's basemap and opacity, which only that type has", async () => {
    returning(TOPICS_EN);

    const views = (await fetchTopics({ locale: "en" })).find(
      (topic) => topic.id === 0,
    )?.default_visualization;

    expect(views?.find((view) => view.type === "map")).toMatchObject({
      indicator_id: 5,
      basemapId: "gray-vector",
      opacity: 1,
    });
  });

  test("refuse a non-numeric id rather than resolving to the wrong record", async () => {
    returning([{ ...TOPICS_EN[0], id: "" }]);

    await expect(fetchTopics({ locale: "en" })).rejects.toThrow(/numeric content id/);
  });
});

describe("the depth each read asks for", () => {
  test("is checked, because no Payload type narrows it", async () => {
    returning([{ ...INDICATORS_EN[0], subtopic: "3" }]);

    await expect(fetchIndicators({ locale: "en" })).rejects.toThrow(/lost its depth/);
  });

  test("is checked in the other direction too, on the flat reads", async () => {
    returning([{ ...SUBTOPICS_EN[0], topic: { id: "0", name: "Geographic context" } }]);

    await expect(fetchSubtopics({ locale: "en" })).rejects.toThrow(/came back populated/);
  });
});

describe("indicators", () => {
  test("hold the Topic beside the Subtopic, where the app expects the two as siblings", async () => {
    returning(INDICATORS_EN);

    const [indicator] = await fetchIndicators({ locale: "en" });

    expect(indicator.topic).toEqual({ id: 0, name: "Geographic context" });
    expect(indicator.subtopic).toMatchObject({ id: 0, topic_id: 0, name: "ACU" });
  });

  test("carry the one resource unwrapped from the block array", async () => {
    returning(INDICATORS_EN);

    const [indicator] = await fetchIndicators({ locale: "en" });

    expect(indicator.resource.type).toBe("component");
    expect(Array.isArray(indicator.resource)).toBe(false);
  });

  test("refuse a row with no resource, which has nothing to draw or measure", async () => {
    returning([{ ...INDICATORS_EN[0], resource: [] }]);

    await expect(fetchIndicators({ locale: "en" })).rejects.toThrow(/has no resource/);
  });

  test("rebuild a popup as the ArcGIS `content` shape, dropping Payload's row ids", async () => {
    returning(INDICATORS_EN);

    const indicator = (await fetchIndicators({ locale: "en" })).find(({ id }) => id === 5);

    expect(indicator?.resource).toMatchObject({
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

  test("leave a popup with neither a title nor a field out entirely", async () => {
    returning(INDICATORS_EN);

    const indicator = (await fetchIndicators({ locale: "en" })).find(({ id }) => id === 1);

    expect(indicator?.resource).toMatchObject({ popupTemplate: undefined });
  });

  test("default an absent visualization_types to empty rather than null", async () => {
    returning([{ ...INDICATORS_EN[0], visualization_types: null }]);

    expect((await fetchIndicators({ locale: "en" }))[0].visualization_types).toEqual([]);
  });
});

describe("localization", () => {
  test("reads a topic in the requested locale", async () => {
    returning(TOPICS_ES);

    expect((await fetchTopics({ locale: "es" })).find((topic) => topic.id === 0)?.name).toBe(
      "Contexto geográfico",
    );
  });

  test("reads a subtopic in the requested locale", async () => {
    returning(SUBTOPICS_ES);

    expect(
      (await fetchSubtopics({ locale: "es" })).find((subtopic) => subtopic.id === 0)?.name,
    ).toBe("ACU");
  });

  test("reads an indicator in the requested locale", async () => {
    returning(INDICATORS_ES);

    expect((await fetchIndicators({ locale: "es" }))[0].name).not.toBe(INDICATORS_EN[0].name);
  });
});
