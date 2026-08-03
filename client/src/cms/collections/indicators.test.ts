import type { SelectField } from "payload";

import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import { warnOnVisualizationMismatch } from "@/cms/hooks/indicator-visualization";
import { findFieldByName, isEmptyValue } from "@/cms/test-utils/find-field";

import { Indicators } from "./Indicators";

const LOCALES = ["en", "es", "pt"] as const;

type SourceIndicator = Record<string, unknown> & {
  id: number;
  subtopic_id: number;
  visualization_types: string[];
};

const indicators = INDICATORS as unknown as SourceIndicator[];
const subtopicIds = new Set((SUBTOPICS as unknown as { id: number }[]).map((s) => s.id));

describe("Indicators", () => {
  test("uses the expected slug and enables drafts", () => {
    expect(Indicators.slug).toBe("indicators");
    expect(Indicators.versions).toEqual({ drafts: true });
  });

  test("is publicly readable but only writable by admins", () => {
    const anonymous = { req: { user: null } } as never;
    const admin = { req: { user: { collection: "admins" } } } as never;

    expect(Indicators.access?.read?.(anonymous)).toBe(true);
    expect(Indicators.access?.update?.(anonymous)).toBe(false);
    expect(Indicators.access?.update?.(admin)).toBe(true);
  });

  test("keeps legacy_id required, unique and immutable", () => {
    const legacyId = findFieldByName(Indicators.fields, "legacy_id");

    expect(legacyId).toMatchObject({ type: "number", required: true, unique: true, index: true });
    expect(legacyId?.access?.update?.({} as never)).toBe(false);
  });

  test("keeps order separate from legacy_id, since they diverge in the source data", () => {
    expect(findFieldByName(Indicators.fields, "order")).toMatchObject({
      type: "number",
      required: true,
    });
    expect(indicators.some((indicator) => indicator.id !== indicator.order)).toBe(true);
  });

  test("relates to subtopics rather than storing a numeric subtopic_id", () => {
    expect(findFieldByName(Indicators.fields, "subtopic")).toMatchObject({
      type: "relationship",
      relationTo: "subtopics",
      required: true,
    });
    expect(findFieldByName(Indicators.fields, "subtopic_id")).toBeUndefined();
  });

  test("every subtopic_id in the source data resolves to a subtopic", () => {
    expect(indicators.filter((indicator) => !subtopicIds.has(indicator.subtopic_id))).toEqual([]);
  });

  test("localizes the four text groups and drops the _en/_es/_pt triples", () => {
    for (const name of ["name", "unit", "description", "description_short"]) {
      expect(findFieldByName(Indicators.fields, name)?.localized).toBe(true);
    }

    for (const name of ["name_en", "unit_es", "description_pt", "description_short_en"]) {
      expect(findFieldByName(Indicators.fields, name)).toBeUndefined();
    }
  });

  test("drops the dead Active field", () => {
    expect(findFieldByName(Indicators.fields, "Active")).toBeUndefined();
    // Dead weight: zero references in client/src and `1` on every row.
    expect(indicators.every((indicator) => indicator.Active === 1)).toBe(true);
  });

  test("requires only the localized fields populated in all three locales", () => {
    const violations: string[] = [];

    for (const name of ["name", "unit", "description", "description_short"]) {
      const field = findFieldByName(Indicators.fields, name);
      if (!field?.required) continue;

      for (const indicator of indicators) {
        for (const locale of LOCALES) {
          if (!isEmptyValue(indicator[`${name}_${locale}`])) continue;
          violations.push(`indicator ${indicator.id}: required "${name}_${locale}" is empty`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("keeps visualization_types explicit, offering every value used in the data", () => {
    // `hasMany` and `options` are select-specific, so narrow rather than widen NamedField.
    const field = findFieldByName(Indicators.fields, "visualization_types") as SelectField;

    expect(field.hasMany).toBe(true);

    const offered = new Set(
      field.options.map((option) => (typeof option === "string" ? option : option.value)),
    );
    const used = new Set(indicators.flatMap((indicator) => indicator.visualization_types));

    expect([...used].filter((type) => !offered.has(type))).toEqual([]);
  });

  test("carries the resource blocks field, holding exactly one resource", () => {
    expect(findFieldByName(Indicators.fields, "resource")).toMatchObject({
      type: "blocks",
      required: true,
      minRows: 1,
      maxRows: 1,
    });
  });

  test("registers the non-blocking visualization mismatch warning", () => {
    expect(Indicators.hooks?.beforeChange).toHaveLength(1);
    expect(Indicators.hooks?.beforeChange?.[0]).toBe(warnOnVisualizationMismatch);
  });

  test("pins which localized fields are required", () => {
    expect(findFieldByName(Indicators.fields, "name")?.required).toBe(true);
    expect(findFieldByName(Indicators.fields, "description_short")?.required).toBe(true);
    expect(findFieldByName(Indicators.fields, "unit")?.required).toBeFalsy();
    expect(findFieldByName(Indicators.fields, "description")?.required).toBeFalsy();
  });
});
