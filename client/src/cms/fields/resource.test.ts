import type { Block } from "payload";

import INDICATORS from "@/../datum/indicators.json";
import {
  fieldNames,
  findFieldByName,
  isEmptyValue,
  namedFields,
} from "@/cms/test-utils/find-field";

import { RESOURCE_BLOCKS } from "./resource";

type SourceResource = Record<string, unknown> & { type: string };
type SourceIndicator = { id: number; resource: SourceResource };

const indicators = INDICATORS as unknown as SourceIndicator[];

/**
 * Documented exceptions from the spec (§9). Any violation NOT listed here is a
 * genuine schema bug. Remove an entry once phase 2 resolves the underlying defect.
 */
const KEYS_WITH_NO_HOME: Record<number, string[]> = {
  // Indicator 12 is a `feature` but carries `rasterFunction: "Forest_Cover_Change"`,
  // a bare string on a layer type that cannot use raster functions. Dropped on purpose.
  12: ["rasterFunction"],
};

/**
 * Keys present in the source JSON that deliberately have no field on the block: the value is
 * constant across every row of that type and no code reads it. Unlike KEYS_WITH_NO_HOME these
 * are not defects — they are fields that belong to one resource type only.
 */
const KEYS_DROPPED_BY_TYPE: Record<string, string[]> = {
  // `layer_id` is the constant "0" on every imagery/h3/component row. types/indicator.ts
  // declares it only on ResourceFeature, and all four readers in lib/indicators.ts build
  // feature-layer URLs. Dropping it keeps the schema aligned with the TS contract.
  imagery: ["layer_id"],
  h3: ["layer_id"],
  component: ["layer_id"],
};

const blocksBySlug = new Map<string, Block>(RESOURCE_BLOCKS.map((block) => [block.slug, block]));

describe("RESOURCE_BLOCKS", () => {
  test("exposes exactly the six expected block slugs", () => {
    expect([...blocksBySlug.keys()].sort()).toEqual([
      "component",
      "feature",
      "h3",
      "imagery",
      "imagery-tile",
      "web-tile",
    ]);
  });

  test("every resource.type in the source data has a matching block slug", () => {
    const types = [...new Set(indicators.map((indicator) => indicator.resource.type))].sort();

    expect(types.filter((type) => !blocksBySlug.has(type))).toEqual([]);
  });

  test("every non-empty resource key has a field in its block", () => {
    const violations: string[] = [];

    for (const indicator of indicators) {
      const { type, ...rest } = indicator.resource;
      const names = fieldNames(blocksBySlug.get(type)!.fields);

      for (const [key, value] of Object.entries(rest)) {
        if (isEmptyValue(value)) continue;
        if (names.includes(key)) continue;
        if (KEYS_WITH_NO_HOME[indicator.id]?.includes(key)) continue;
        if (KEYS_DROPPED_BY_TYPE[type]?.includes(key)) continue;

        violations.push(`indicator ${indicator.id} (${type}): "${key}" has no field`);
      }
    }

    expect(violations).toEqual([]);
  });

  test("every required block field is non-empty on every row of that type", () => {
    const violations: string[] = [];

    for (const indicator of indicators) {
      const block = blocksBySlug.get(indicator.resource.type)!;

      for (const field of namedFields(block.fields)) {
        if (!field.required) continue;
        if (!isEmptyValue(indicator.resource[field.name])) continue;

        violations.push(
          `indicator ${indicator.id} (${indicator.resource.type}): required "${field.name}" is empty`,
        );
      }
    }

    expect(violations).toEqual([]);
  });

  test("feature blocks keep layer_id as text, since lib/indicators.ts concatenates it", () => {
    expect(findFieldByName(blocksBySlug.get("feature")!.fields, "layer_id")?.type).toBe("text");
  });

  test("the component block keeps query_ai, which indicator 0 carries", () => {
    expect(fieldNames(blocksBySlug.get("component")!.fields)).toContain("query_ai");
  });

  test('layer_id is always the constant "0" on every type it\'s dropped from', () => {
    const violations: string[] = [];

    for (const indicator of indicators) {
      const { type } = indicator.resource;
      if (!KEYS_DROPPED_BY_TYPE[type]?.includes("layer_id")) continue;
      if (indicator.resource.layer_id === "0") continue;

      violations.push(
        `indicator ${indicator.id} (${type}): layer_id is ${JSON.stringify(indicator.resource.layer_id)}, not the expected constant "0"`,
      );
    }

    expect(violations).toEqual([]);
  });
});
