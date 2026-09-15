import type { RadioField } from "payload";

import INDICATORS from "@/../datum/indicators.json";
import TOPICS from "@/../datum/topics.json";
import { findFieldByName, isEmptyValue, namedFields } from "@/cms/test-utils/find-field";

import { DefaultVisualizationField } from "./default-visualization";

type SourceVisualization = Record<string, unknown> & { indicator_id: number; type: string };
type SourceTopic = { id: number; default_visualization: SourceVisualization[] };

const topics = TOPICS as unknown as SourceTopic[];

const arrayFields = () => {
  const field = DefaultVisualizationField;
  if (field.type !== "array") throw new Error("DefaultVisualizationField must be an array field");
  return field.fields;
};

describe("DefaultVisualizationField", () => {
  test("is an array field named default_visualization", () => {
    expect(DefaultVisualizationField.type).toBe("array");
    expect(findFieldByName([DefaultVisualizationField], "default_visualization")).toBeDefined();
  });

  test("references indicators by relationship, not by numeric id", () => {
    const indicator = findFieldByName(arrayFields(), "indicator");

    expect(indicator?.type).toBe("relationship");
    expect(findFieldByName(arrayFields(), "indicator_id")).toBeUndefined();
  });

  test("drops the source JSON's redundant inner id", () => {
    expect(findFieldByName(arrayFields(), "id")).toBeUndefined();
  });

  test("offers every visualization type used in the source data", () => {
    // `options` is radio-specific, so narrow to RadioField rather than widening NamedField.
    const typeField = findFieldByName(arrayFields(), "type") as RadioField;
    const offered = new Set(
      typeField.options.map((option) => (typeof option === "string" ? option : option.value)),
    );
    const used = new Set(topics.flatMap((topic) => topic.default_visualization.map((v) => v.type)));

    expect([...used].filter((type) => !offered.has(type))).toEqual([]);
  });

  test("every required field is present on every source visualization entry", () => {
    const violations: string[] = [];
    const required = namedFields(arrayFields()).filter((field) => field.required);

    for (const topic of topics) {
      for (const [index, visualization] of topic.default_visualization.entries()) {
        for (const field of required) {
          // `indicator` is the relationship replacing the source's `indicator_id`.
          const key = field.name === "indicator" ? "indicator_id" : field.name;
          if (!isEmptyValue(visualization[key])) continue;

          violations.push(`topics ${topic.id}[${index}]: missing "${key}"`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test.each(["basemapId", "opacity"] as const)(
    "clears %s on save when the widget is not a map",
    (fieldName) => {
      const field = findFieldByName(arrayFields(), fieldName);
      const beforeChange = field?.hooks?.beforeChange?.[0];

      expect(beforeChange).toBeDefined();
      expect(
        beforeChange?.({ value: "some-value", siblingData: { type: "chart" } } as never),
      ).toBeNull();
    },
  );

  test.each(["basemapId", "opacity"] as const)(
    "keeps %s on save when the widget is a map",
    (fieldName) => {
      const field = findFieldByName(arrayFields(), fieldName);
      const beforeChange = field?.hooks?.beforeChange?.[0];

      expect(beforeChange).toBeDefined();
      expect(beforeChange?.({ value: "some-value", siblingData: { type: "map" } } as never)).toBe(
        "some-value",
      );
    },
  );

  test("every indicator referenced by a layout exists", () => {
    const indicatorIds = new Set(
      (INDICATORS as unknown as { id: number }[]).map((indicator) => indicator.id),
    );
    const dangling: string[] = [];

    for (const topic of topics) {
      for (const visualization of topic.default_visualization) {
        if (indicatorIds.has(visualization.indicator_id)) continue;
        dangling.push(`topics ${topic.id} -> indicator ${visualization.indicator_id}`);
      }
    }

    expect(dangling).toEqual([]);
  });
});
