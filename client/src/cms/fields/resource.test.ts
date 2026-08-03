import type { Block, Field } from "payload";

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

/**
 * Recurses into `group` and `array` fields (fanning out once per array item) to find nested
 * `required` fields that are empty in `data`. Deliberately kept local to this file rather than
 * added to `find-field.ts`: it interleaves schema (`field.required`) with real data (fanning out
 * over array *items*, not just the array field's own shape), which is business logic specific to
 * this conformance check, not something the other three consumers of `find-field.ts` need.
 *
 * `namedFields`/`fieldNames` stay deliberately shallow (see their docstrings) — this reaches the
 * fields they cannot: `legend.type`, `legend.items`, `legend.items[].label`,
 * `legend.items[].color`, `popupTemplate.fieldInfos[].fieldName` and
 * `popupTemplate.fieldInfos[].label`. These are the schema's only *nested* `required`
 * constraints.
 *
 * Top-level (depth 0) required fields are intentionally NOT reported here — that's the "every
 * required block field is non-empty on every row of that type" test's job. `path` starts empty
 * and only becomes truthy once we've descended at least one level, which is what gates the check.
 */
const collectNestedRequiredViolations = (fields: Field[], data: unknown, path = ""): string[] => {
  const violations: string[] = [];
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  for (const field of namedFields(fields)) {
    const value = record[field.name];
    const fieldPath = path ? `${path}.${field.name}` : field.name;

    if (path && field.required && isEmptyValue(value)) {
      violations.push(fieldPath);
      continue;
    }

    if (field.type === "group") {
      violations.push(...collectNestedRequiredViolations(field.fields, value, fieldPath));
    } else if (field.type === "array" && Array.isArray(value)) {
      value.forEach((item, index) => {
        violations.push(
          ...collectNestedRequiredViolations(field.fields, item, `${fieldPath}[${index}]`),
        );
      });
    }
  }

  return violations;
};

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

  test("pins which blocks require resource.name", () => {
    // Deliberate human ruling, not an oversight: 14 real source rows (12 `feature`, 2 `imagery`)
    // carry `resource.name: ""`. Making `name` uniformly required would make those rows
    // unseedable in phase 2, so it's required only on `component`/`h3` — where every row
    // populates it, and where `component`'s name is load-bearing (it keys
    // COMPONENT_INDICATORS in containers/indicators/custom/index.tsx). Do not "normalize"
    // this back to required on all six blocks.
    expect(findFieldByName(blocksBySlug.get("h3")!.fields, "name")?.required).toBe(true);
    expect(findFieldByName(blocksBySlug.get("component")!.fields, "name")?.required).toBe(true);

    expect(findFieldByName(blocksBySlug.get("feature")!.fields, "name")?.required).toBeFalsy();
    expect(findFieldByName(blocksBySlug.get("imagery")!.fields, "name")?.required).toBeFalsy();
    expect(findFieldByName(blocksBySlug.get("imagery-tile")!.fields, "name")?.required).toBeFalsy();
    expect(findFieldByName(blocksBySlug.get("web-tile")!.fields, "name")?.required).toBeFalsy();
  });

  test("nested required fields (legend, popupTemplate.fieldInfos) are non-empty on every row", () => {
    const violations: string[] = [];

    for (const indicator of indicators) {
      const block = blocksBySlug.get(indicator.resource.type)!;

      for (const path of collectNestedRequiredViolations(block.fields, indicator.resource)) {
        violations.push(
          `indicator ${indicator.id} (${indicator.resource.type}): required "${path}" is empty`,
        );
      }
    }

    expect(violations).toEqual([]);
  });

  test("popupTemplate.content matches the shape the schema drops and reconstructs on read", () => {
    // The schema drops `popupTemplate.content` and rebuilds it on read as
    // `{ title, content: [{ type: "fields", fieldInfos }] }` (see the admin description on the
    // `popupTemplate` field in resource.ts). That reconstruction is only lossless if this shape
    // holds for every row that carries `content` today — phase 2's transform depends on it.
    const violations: string[] = [];

    for (const indicator of indicators) {
      const popupTemplate = (indicator.resource as { popupTemplate?: { content?: unknown } })
        .popupTemplate;
      const content = popupTemplate?.content;
      if (content === undefined) continue;

      if (!Array.isArray(content) || content.length !== 1) {
        const size = Array.isArray(content) ? content.length : typeof content;
        violations.push(
          `indicator ${indicator.id}: popupTemplate.content has ${size} elements, expected exactly 1`,
        );
        continue;
      }

      const [entry] = content as Record<string, unknown>[];
      const entryKeys = Object.keys(entry).sort().join(",");
      if (entryKeys !== "fieldInfos,type") {
        violations.push(
          `indicator ${indicator.id}: popupTemplate.content[0] keys are "${entryKeys}", expected exactly "fieldInfos,type"`,
        );
      }
      if (entry.type !== "fields") {
        violations.push(
          `indicator ${indicator.id}: popupTemplate.content[0].type is ${JSON.stringify(entry.type)}, expected "fields"`,
        );
      }

      const fieldInfos = (entry.fieldInfos as Record<string, unknown>[] | undefined) ?? [];
      fieldInfos.forEach((fieldInfo, index) => {
        const fieldInfoKeys = Object.keys(fieldInfo).sort().join(",");
        if (fieldInfoKeys !== "fieldName,label") {
          violations.push(
            `indicator ${indicator.id}: popupTemplate.content[0].fieldInfos[${index}] keys are "${fieldInfoKeys}", expected exactly "fieldName,label"`,
          );
        }
      });
    }

    expect(violations).toEqual([]);
  });
});
