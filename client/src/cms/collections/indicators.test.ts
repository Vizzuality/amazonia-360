import type { RadioField, RelationshipField, SelectField } from "payload";

import INDICATORS_ECU from "@/../datum/indicators.ECU.json";
import INDICATORS from "@/../datum/indicators.json";
import SUBTOPICS from "@/../datum/subtopics.json";
import { catalogueCreateAccess } from "@/cms/access/catalogue";
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

  test("is created only by import, never by hand", () => {
    expect(Indicators.access?.create).toBe(catalogueCreateAccess);
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

  test("scopes an indicator to at most one country module, and treats none as the region", () => {
    const moduleField = findFieldByName(Indicators.fields, "module") as RelationshipField;

    expect(moduleField).toMatchObject({ type: "relationship", relationTo: "country-modules" });
    expect(moduleField.required).toBeFalsy();
    expect(moduleField.hasMany).toBeFalsy();
    expect(findFieldByName(Indicators.fields, "country")).toMatchObject({
      admin: { hidden: true },
    });

    // The source agrees: the regional rows name no module, and absence is what makes them
    // regional rather than a row that belongs to every country.
    expect(INDICATORS.every((row) => !("country" in row))).toBe(true);
    expect(INDICATORS_ECU.every((row) => row.country === "ECU")).toBe(true);
  });

  test("lets a module indicator name only a regional one as the indicator it replaces", () => {
    const replaces = findFieldByName(Indicators.fields, "replaces") as RelationshipField;

    expect(replaces).toMatchObject({ type: "relationship", relationTo: "indicators" });
    expect(replaces.hasMany).toBeFalsy();

    const filterOptions = replaces.filterOptions as (args: never) => unknown;
    expect(filterOptions({} as never)).toEqual({ module: { exists: false } });

    const condition = replaces.admin?.condition as (data: unknown) => boolean;
    expect(condition({ module: "module-1" })).toBe(true);
    expect(condition({ module: null })).toBe(false);
    expect(condition({})).toBe(false);
  });

  describe("replaces hook", () => {
    const replaces = findFieldByName(Indicators.fields, "replaces") as RelationshipField;
    const hook = replaces.hooks?.beforeChange?.[0] as (args: unknown) => unknown;

    test.each([{ module: "module-1" }, { module: { id: "module-1" } }])(
      "keeps the replaced indicator while the indicator has a module (%o)",
      (siblingData) => {
        expect(hook({ value: "12", siblingData })).toBe("12");
      },
    );

    test.each([{ module: null }, {}])(
      "clears the replaced indicator when the module is removed (%o)",
      (siblingData) => {
        expect(hook({ value: "12", siblingData })).toBeNull();
      },
    );
  });

  describe("partners", () => {
    const partners = findFieldByName(Indicators.fields, "partners") as RelationshipField;
    const filterOptions = partners.filterOptions as (args: { data: unknown }) => unknown;

    test("relates to many partners, placed right after module", () => {
      expect(partners).toMatchObject({
        type: "relationship",
        relationTo: "partners",
        hasMany: true,
      });
      expect(partners.required).toBeFalsy();

      const names = Indicators.fields.map((field) => ("name" in field ? field.name : null));
      expect(names.indexOf("partners")).toBe(names.indexOf("module") + 1);
    });

    test("offers only the partners of the indicator's module, given its id", () => {
      expect(filterOptions({ data: { module: "module-1" } })).toEqual({
        modules: { equals: "module-1" },
      });
    });

    test("offers only the partners of the indicator's module, given it populated", () => {
      expect(filterOptions({ data: { module: { id: "module-1", slug: "ECU" } } })).toEqual({
        modules: { equals: "module-1" },
      });
    });

    test.each([{ module: null }, { module: undefined }, {}, undefined])(
      "offers no partners without a module (%o)",
      (data) => {
        expect(filterOptions({ data })).toBe(false);
      },
    );

    test("keeps the chosen partners while the indicator has a module", () => {
      const hook = partners.hooks?.beforeChange?.[0] as (args: unknown) => unknown;

      expect(hook({ value: ["partner-1"], siblingData: { module: "module-1" } })).toEqual([
        "partner-1",
      ]);
      expect(hook({ value: ["partner-1"], siblingData: { module: { id: "module-1" } } })).toEqual([
        "partner-1",
      ]);
    });

    test.each([{ module: null }, {}])(
      "clears partners when the module is removed (%o)",
      (siblingData) => {
        const hook = partners.hooks?.beforeChange?.[0] as (args: unknown) => unknown;

        expect(hook({ value: ["partner-1"], siblingData })).toEqual([]);
      },
    );

    test("is hidden until the indicator has a module", () => {
      const condition = partners.admin?.condition as (data: unknown) => boolean;

      expect(condition({ module: "module-1" })).toBe(true);
      expect(condition({ module: null })).toBe(false);
      expect(condition({})).toBe(false);
    });
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
