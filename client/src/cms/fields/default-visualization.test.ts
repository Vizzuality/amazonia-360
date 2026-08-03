import type { RadioField } from "payload";

import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";
import { findFieldByName, isEmptyValue, namedFields } from "@/cms/test-utils/find-field";

import { DefaultVisualizationField } from "./default-visualization";

type SourceVisualization = Record<string, unknown> & { indicator_id: number; type: string };
type SourceGroup = { id: number; default_visualization: SourceVisualization[] };

const groups: { collection: string; rows: SourceGroup[] }[] = [
  { collection: "topics", rows: TOPICS as unknown as SourceGroup[] },
  { collection: "subtopics", rows: SUBTOPICS as unknown as SourceGroup[] },
];

/** Documented defect from the spec (§9): subtopic 26 points at a nonexistent indicator 55. */
const KNOWN_DANGLING = ["subtopics 26 -> indicator 55"];

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
    const used = new Set(
      groups.flatMap(({ rows }) => rows.flatMap((row) => row.default_visualization.map((v) => v.type))),
    );

    expect([...used].filter((type) => !offered.has(type))).toEqual([]);
  });

  test("every required field is present on every source visualization entry", () => {
    const violations: string[] = [];
    const required = namedFields(arrayFields()).filter((field) => field.required);

    for (const { collection, rows } of groups) {
      for (const row of rows) {
        for (const [index, visualization] of row.default_visualization.entries()) {
          for (const field of required) {
            // `indicator` is the relationship replacing the source's `indicator_id`.
            const key = field.name === "indicator" ? "indicator_id" : field.name;
            if (!isEmptyValue(visualization[key])) continue;

            violations.push(`${collection} ${row.id}[${index}]: missing "${key}"`);
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("only the documented dangling indicator reference exists", () => {
    const indicatorIds = new Set(
      (INDICATORS as unknown as { id: number }[]).map((indicator) => indicator.id),
    );
    const dangling: string[] = [];

    for (const { collection, rows } of groups) {
      for (const row of rows) {
        for (const visualization of row.default_visualization) {
          if (indicatorIds.has(visualization.indicator_id)) continue;
          dangling.push(`${collection} ${row.id} -> indicator ${visualization.indicator_id}`);
        }
      }
    }

    expect(dangling).toEqual(KNOWN_DANGLING);
  });
});
