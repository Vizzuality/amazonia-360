import type { RadioField, RelationshipField, SelectField } from "payload";

import { COUNTRIES } from "@/lib/country";

import INDICATORS_ECU from "@/../datum/indicators.ECU.json";
import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import { invalidDefaultMessage } from "@/cms/fields/default-visualization-type";
import { warnOnVisualizationMismatch } from "@/cms/hooks/indicator-visualization";
import { findFieldByName, isEmptyValue } from "@/cms/test-utils/find-field";

import { Indicators } from "./Indicators";

const LOCALES = ["en", "es", "pt"] as const;

type SourceIndicator = Record<string, unknown> & {
  id: number;
  subtopic_id: number;
  visualization_types: string[];
  default_visualization_type: string | null;
  country?: string | null;
  replaces?: number | null;
};

const indicators = [...INDICATORS, ...INDICATORS_ECU] as unknown as SourceIndicator[];
const regionalIds = new Set((INDICATORS as unknown as SourceIndicator[]).map(({ id }) => id));
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

  test("constrains default_visualization_type to the indicator's own visualization_types", () => {
    const field = findFieldByName(Indicators.fields, "default_visualization_type") as RadioField;
    const run = (value: unknown, visualization_types: unknown) =>
      field.validate?.(
        value as never,
        {
          ...field,
          siblingData: { visualization_types },
        } as never,
      );

    expect(run("chart", ["map", "chart"])).toBe(true);
    expect(run("chart", ["map"])).toBe(invalidDefaultMessage("chart"));
    expect(run("chart", [])).toBe(invalidDefaultMessage("chart"));

    // Optional: no default is always fine, including on the 76 rows that declare no type.
    expect(run(null, [])).toBe(true);
    expect(run(undefined, ["map"])).toBe(true);
  });

  test("renders default_visualization_type through the component that filters the radios", () => {
    const field = findFieldByName(Indicators.fields, "default_visualization_type") as RadioField;

    // `radio` has no `filterOptions`, so the narrowing on screen is the component's job.
    // Losing it leaves the admin offering radios that `validate` rejects.
    expect(field.admin?.components?.Field).toBe(
      "/cms/components/default-visualization-type-field#DefaultVisualizationTypeField",
    );
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

  test("scopes an indicator to one country module, and treats no country as the region", () => {
    const country = findFieldByName(Indicators.fields, "country") as SelectField;

    expect(country.type).toBe("select");
    expect(country.required).toBeFalsy();
    expect(country.hasMany).toBeFalsy();
    expect(country.options).toEqual(COUNTRIES.map(({ code }) => ({ label: code, value: code })));

    // The source agrees: the regional rows name no module, and absence is what makes them
    // regional rather than a row that belongs to every country.
    expect(INDICATORS.every((row) => !("country" in row))).toBe(true);
    expect(INDICATORS_ECU.every((row) => row.country === "ECU")).toBe(true);
  });

  test("lets a country indicator name only a regional one as the indicator it replaces", () => {
    const replaces = findFieldByName(Indicators.fields, "replaces") as RelationshipField;

    expect(replaces).toMatchObject({ type: "relationship", relationTo: "indicators" });
    expect(replaces.hasMany).toBeFalsy();

    const filterOptions = replaces.filterOptions as (args: never) => unknown;
    expect(filterOptions({} as never)).toEqual({ country: { exists: false } });

    const condition = replaces.admin?.condition as (data: unknown) => boolean;
    expect(condition({ country: "ECU" })).toBe(true);
    expect(condition({ country: null })).toBe(false);
    expect(condition({})).toBe(false);
  });

  test("keeps every replacement in the source pointed at a regional Content Code", () => {
    const replacements = indicators.filter(({ replaces }) => replaces != null);

    expect(replacements.length).toBeGreaterThan(0);

    for (const { id, replaces } of replacements) {
      expect(regionalIds.has(replaces as number), `indicator ${id} replaces ${replaces}`).toBe(
        true,
      );
    }
  });

  test("pins which localized fields are required", () => {
    expect(findFieldByName(Indicators.fields, "name")?.required).toBe(true);
    expect(findFieldByName(Indicators.fields, "description_short")?.required).toBe(true);
    expect(findFieldByName(Indicators.fields, "unit")?.required).toBeFalsy();
    expect(findFieldByName(Indicators.fields, "description")?.required).toBeFalsy();
  });
});
