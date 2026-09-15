import type { RadioField, SelectField } from "payload";

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
  default_visualization_type: string | null;
};

/**
 * Indicator 0 declares `numeric` but only offers `map`, so the sidebar can never draw its
 * badge. Inherited verbatim from the source data: the move off subtopics preserved every
 * value rather than quietly fixing this one, which is a data decision.
 */
const KNOWN_UNREACHABLE_DEFAULT = [0];

const indicators = INDICATORS as unknown as SourceIndicator[];
const subtopicIds = new Set((SUBTOPICS as unknown as { id: number }[]).map((s) => s.id));

describe("Indicators", () => {
  test("uses the expected slug and enables drafts", () => {
    expect(Indicators.slug).toBe("indicators");
    expect(Indicators.versions).toEqual({ drafts: true });
  });

  test("restricts read to published documents for everyone except admins", () => {
    const anonymous = { req: { user: null } } as never;
    const admin = { req: { user: { collection: "admins" } } } as never;
    const signedInUser = { req: { user: { collection: "users" } } } as never;

    expect(Indicators.access?.read?.(anonymous)).toEqual({ _status: { equals: "published" } });
    // The owner-directed case: a signed-in non-admin still only sees published content.
    expect(Indicators.access?.read?.(signedInUser)).toEqual({
      _status: { equals: "published" },
    });
    expect(Indicators.access?.read?.(admin)).toBe(true);

    expect(Indicators.access?.update?.(anonymous)).toBe(false);
    expect(Indicators.access?.update?.(admin)).toBe(true);
  });

  test("keeps id (the Content Code) required, read-only and immutable", () => {
    const id = findFieldByName(Indicators.fields, "id");

    expect(id).toMatchObject({ type: "text", required: true, admin: { readOnly: true } });
    expect(id?.access?.update?.({} as never)).toBe(false);
  });

  test("keeps order separate from id, since they diverge in the source data", () => {
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

  test("offers default_visualization_type as an optional radio over the same four types", () => {
    const field = findFieldByName(Indicators.fields, "default_visualization_type") as RadioField;
    const visualizationTypes = findFieldByName(
      Indicators.fields,
      "visualization_types",
    ) as SelectField;
    const values = (options: RadioField["options"] | SelectField["options"]) =>
      options.map((option) => (typeof option === "string" ? option : option.value));

    expect(field.type).toBe("radio");
    expect(field.required).toBeFalsy();
    expect(values(field.options)).toEqual(values(visualizationTypes.options));
  });

  test("every default_visualization_type in the source data is an offered value", () => {
    const field = findFieldByName(Indicators.fields, "default_visualization_type") as RadioField;
    const offered = new Set(
      field.options.map((option) => (typeof option === "string" ? option : option.value)),
    );

    const invalid = indicators.filter(
      (indicator) =>
        indicator.default_visualization_type !== null &&
        !offered.has(indicator.default_visualization_type),
    );

    expect(invalid).toEqual([]);
  });

  test("a declared default is one of the indicator's own visualization_types", () => {
    const violations = indicators
      .filter((indicator) => !KNOWN_UNREACHABLE_DEFAULT.includes(indicator.id))
      .filter(
        (indicator) =>
          indicator.default_visualization_type !== null &&
          !indicator.visualization_types.includes(indicator.default_visualization_type),
      )
      .map((indicator) => indicator.id);

    expect(violations).toEqual([]);
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
