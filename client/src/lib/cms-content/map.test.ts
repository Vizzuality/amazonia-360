import { ResourceFeature, ResourceH3, ResourceImagery } from "@/types/indicator";

import INDICATORS_EN from "./__fixtures__/indicators.en.json";
import INDICATORS_ES from "./__fixtures__/indicators.es.json";
import INDICATORS_PT from "./__fixtures__/indicators.pt.json";
import SUBTOPICS_EN from "./__fixtures__/subtopics.en.json";
import SUBTOPICS_ES from "./__fixtures__/subtopics.es.json";
import TOPICS_EN from "./__fixtures__/topics.en.json";
import TOPICS_ES from "./__fixtures__/topics.es.json";
import TOPICS_PT from "./__fixtures__/topics.pt.json";
import { toIndicator, toSubtopic, toTopic } from "./map";
import { CmsIndicator, CmsResourceBlock, CmsSubtopic, CmsTopic } from "./types";

const topics = (fixture: unknown) => (fixture as CmsTopic[]).map(toTopic);
const subtopics = (fixture: unknown) => (fixture as CmsSubtopic[]).map(toSubtopic);
const indicators = (fixture: unknown) => (fixture as CmsIndicator[]).map(toIndicator);

const indicator = (fixture: unknown, id: number) => {
  const found = indicators(fixture).find((i) => i.id === id);
  if (!found) throw new Error(`fixture has no indicator ${id}`);
  return found;
};

describe("id coercion", () => {
  test("turns the CMS varchar ids into the numbers the rest of the app speaks", () => {
    expect(topics(TOPICS_EN).map((topic) => topic.id)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(subtopics(SUBTOPICS_EN).every((subtopic) => typeof subtopic.id === "number")).toBe(true);
    expect(indicators(INDICATORS_EN).every((i) => typeof i.id === "number")).toBe(true);
  });

  test("coerces the ids saved reports and shared URLs are keyed on", () => {
    const subtopic = subtopics(SUBTOPICS_EN).find((s) => s.id === 0);

    expect(subtopic?.topic_id).toBe(0);
    expect(indicator(INDICATORS_EN, 0).subtopic.topic_id).toBe(0);
  });

  test("resolves a topic's layout to numeric indicator ids", () => {
    const overview = topics(TOPICS_EN).find((topic) => topic.id === 0);

    expect(overview?.default_visualization[0]).toMatchObject({ indicator_id: 0, type: "numeric" });
    expect(
      overview?.default_visualization.every((view) => typeof view.indicator_id === "number"),
    ).toBe(true);
  });

  test("keeps a layout row's own id distinct from the indicator it points at", () => {
    // Payload's array-row id is opaque. It used to equal the indicator id in the source
    // JSON, which made `Number(view.id)` look like a way to reach the indicator; it is not.
    const view = topics(TOPICS_EN).find((topic) => topic.id === 0)?.default_visualization[0];

    expect(Number(view?.id)).toBeNaN();
    expect(view?.indicator_id).toBe(0);
  });

  test.each(["overview", "", "  ", "1.5"])(
    "refuses the id %o rather than resolving it to the wrong record",
    (id) => {
      // Number("") is 0 — a real Topic and a real Indicator — so an empty id must not pass.
      expect(() => toTopic({ id, name: "Overview" })).toThrow(/numeric content id/);
    },
  );
});

describe("relationships", () => {
  test("flattens the Topic out from under the Subtopic, where the app holds them as siblings", () => {
    const amazonia = indicator(INDICATORS_EN, 1);

    expect(amazonia.subtopic).toMatchObject({
      id: expect.any(Number),
      topic_id: expect.any(Number),
    });
    expect(amazonia.topic.id).toBe(amazonia.subtopic.topic_id);
    expect(amazonia.topic.name).toEqual(expect.any(String));
  });

  test("keeps a topic's map widget settings and drops them from the others", () => {
    const risks = topics(TOPICS_EN).find((topic) => topic.id === 6);
    const map = risks?.default_visualization.find((view) => view.type === "map");
    const numeric = risks?.default_visualization.find((view) => view.type === "numeric");

    expect(map).toMatchObject({ basemapId: "gray-vector", opacity: 1 });
    expect(numeric).not.toHaveProperty("basemapId");
    expect(numeric).not.toHaveProperty("opacity");
  });
});

describe("locales", () => {
  test("returns each locale's own text", () => {
    expect(indicator(INDICATORS_EN, 1).name).toBe("Amazonia");
    expect(indicator(INDICATORS_ES, 1).name).toBe("Amazonía");
    expect(indicator(INDICATORS_PT, 1).name).toBe("Amazônia");

    expect(topics(TOPICS_EN).find((t) => t.id === 0)?.name).toBe("Geographic context");
    expect(topics(TOPICS_ES).find((t) => t.id === 0)?.name).toBe("Contexto geográfico");
  });

  test("carries an untranslated row through instead of blanking it", () => {
    // Subtopic names are English-only in the source data; es falls back rather than emptying.
    expect(subtopics(SUBTOPICS_ES).find((s) => s.id === 0)?.name).toBe("ACU");
  });

  test("leaves an absent optional field undefined in every locale", () => {
    for (const fixture of [INDICATORS_EN, INDICATORS_ES, INDICATORS_PT]) {
      expect(indicator(fixture, 70).description).toBeUndefined();
      expect(indicator(fixture, 1).unit).toBeUndefined();
    }
  });

  test("maps the same records in every locale", () => {
    const ids = (fixture: unknown) => indicators(fixture).map((i) => i.id);

    expect(ids(INDICATORS_ES)).toEqual(ids(INDICATORS_EN));
    expect(ids(INDICATORS_PT)).toEqual(ids(INDICATORS_EN));
    expect(topics(TOPICS_PT).map((t) => t.id)).toEqual(topics(TOPICS_EN).map((t) => t.id));
  });
});

describe("resources", () => {
  test("reads the resource kind off the block type", () => {
    expect(indicator(INDICATORS_EN, 0).resource.type).toBe("component");
    expect(indicator(INDICATORS_EN, 1).resource.type).toBe("feature");
    expect(indicator(INDICATORS_EN, 7).resource.type).toBe("imagery");
    expect(indicator(INDICATORS_EN, 65).resource.type).toBe("h3");
  });

  test("keeps layer_id as text, since the layer URL is built by concatenation", () => {
    const resource = indicator(INDICATORS_EN, 1).resource as ResourceFeature;

    expect(typeof resource.layer_id).toBe("string");
    expect(`${resource.url}${resource.layer_id}`).toContain(resource.url);
  });

  test("rebuilds a popupTemplate into the shape ArcGIS takes", () => {
    const resource = indicator(INDICATORS_EN, 5).resource as ResourceFeature;

    expect(resource.popupTemplate).toEqual({
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
    });
  });

  test("keeps a title-only popup, which ten features carry", () => {
    const resource = toIndicator(
      withResource(indicator0Fixture(), {
        blockType: "feature",
        url: "https://example.test/FeatureServer",
        layer_id: "0",
        popupTemplate: { title: "{DESIGNAT}", fieldInfos: [] },
      }),
    ).resource as ResourceFeature;

    // An empty `content` would leave ArcGIS nothing to draw, and dropping the whole
    // template would stop `components/map/layers` building a popup at all.
    expect(resource.popupTemplate).toEqual({ title: "{DESIGNAT}" });
  });

  test("leaves popupTemplate off a feature with neither a title nor fields", () => {
    expect((indicator(INDICATORS_EN, 1).resource as ResourceFeature).popupTemplate).toBeUndefined();

    const empty = toIndicator(
      withResource(indicator0Fixture(), {
        blockType: "feature",
        url: "https://example.test/FeatureServer",
        layer_id: "0",
        popupTemplate: { title: null, fieldInfos: [] },
      }),
    ).resource as ResourceFeature;

    expect(empty.popupTemplate).toBeUndefined();
  });

  test("carries the imagery aggregation the AI summary reduces the raster with", () => {
    expect((indicator(INDICATORS_EN, 37).resource as ResourceImagery).aggregation).toBe("mean");
    expect((indicator(INDICATORS_EN, 7).resource as ResourceImagery).aggregation).toBe("none");
  });

  test("keeps the h3 column the grid matches datasets on", () => {
    expect((indicator(INDICATORS_EN, 65).resource as ResourceH3).column).toEqual(
      expect.any(String),
    );
  });

  test("gives every legend item an id, including one the CMS has not saved yet", () => {
    const saved = (indicator(INDICATORS_EN, 7).resource as ResourceImagery).legend;

    expect(saved.items.every((item) => item.id !== undefined)).toBe(true);

    const unsaved = toIndicator(
      withResource(indicator0Fixture(), {
        blockType: "imagery",
        url: "https://example.test/ImageServer",
        rasterFunction: null,
        aggregation: "sum",
        legend: { type: "basic", items: [{ color: "#EEF0BA" }] },
      }),
    ).resource as ResourceImagery;

    expect(unsaved.legend.items[0].id).toBe(0);
  });

  test("maps the two resource kinds the catalogue holds no rows for", () => {
    const webTile = toIndicator(
      withResource(indicator0Fixture(), {
        blockType: "web-tile",
        name: "tiles",
        url: "https://example.test/{z}/{x}/{y}.png",
      }),
    ).resource;

    expect(webTile).toEqual({
      type: "web-tile",
      name: "tiles",
      url: "https://example.test/{z}/{x}/{y}.png",
    });

    const imageryTile = toIndicator(
      withResource(indicator0Fixture(), {
        blockType: "imagery-tile",
        url: "https://example.test/ImageServer",
        rasterFunction: null,
        legend: { type: "basic", items: [{ id: "a", color: "#EEF0BA" }] },
      }),
    ).resource;

    expect(imageryTile).toMatchObject({ type: "imagery-tile", name: "" });
  });

  test("refuses an indicator with no resource rather than handing back a broken widget", () => {
    expect(() => toIndicator({ ...indicator0Fixture(), resource: [] })).toThrow(/has no resource/);
  });
});

describe("defaults", () => {
  test("reads an absent visualization list as none offered, not as undefined", () => {
    expect(indicator(INDICATORS_EN, 65).visualization_types).toEqual([]);
  });

  test("keeps the default widget type the sidebar badges", () => {
    expect(indicator(INDICATORS_EN, 0).default_visualization_type).toBe("numeric");
    expect(indicator(INDICATORS_EN, 65).default_visualization_type).toBeNull();
  });

  test("keeps order, which diverges from the id on some rows", () => {
    const diverging = indicator(INDICATORS_EN, 15);

    expect(diverging.order).not.toBe(diverging.id);
  });
});

const indicator0Fixture = () => (INDICATORS_EN as unknown as CmsIndicator[])[0];

const withResource = (fixture: CmsIndicator, resource: CmsResourceBlock): CmsIndicator => ({
  ...fixture,
  resource: [resource],
});
