import type { ArrayField, Field, NumberField, SelectField } from "payload";

import { COUNTRIES } from "@/lib/country";

import INDICATORS from "@/../datum/indicators.json";
import { Indicators } from "@/cms/collections/Indicators";

import {
  GovernanceFields,
  MeasurementFields,
  MetadataFields,
  ProvenanceFields,
  ScopeFields,
  SyncFields,
} from "./metadata";
import {
  ADMIN_LEVEL_OPTIONS,
  AGGREGATION_OPTIONS,
  IMAGERY_AGGREGATION_OPTIONS,
  SENSITIVITY_OPTIONS,
  SYNC_STATUS_OPTIONS,
  UPDATE_CADENCE_OPTIONS,
  VALUE_TYPE_OPTIONS,
  adminLevelsSupported,
  type VocabularyOption,
} from "./metadata-vocabularies";

const VOCABULARIES = {
  aggregation: AGGREGATION_OPTIONS,
  value_type: VALUE_TYPE_OPTIONS,
  sensitivity: SENSITIVITY_OPTIONS,
  update_cadence: UPDATE_CADENCE_OPTIONS,
  sync_status: SYNC_STATUS_OPTIONS,
  admin_level: ADMIN_LEVEL_OPTIONS,
  imagery_aggregation: IMAGERY_AGGREGATION_OPTIONS,
} satisfies Record<string, readonly VocabularyOption[]>;

/** Local rather than in test-utils: only this file reaches inside a group. */
const named = (fields: Field[]) =>
  fields.filter(
    (field): field is Field & { name: string } => "name" in field && field.type !== "ui",
  );

const byName = (fields: Field[], name: string) => named(fields).find((f) => f.name === name);

const namesOf = (fields: Field[]) => named(fields).map((f) => f.name);

const valuesOf = (options: readonly VocabularyOption[]) => options.map((o) => o.value);

/** `admin.description` sits on most field types but not on every member of the union. */
const describedBy = (field: Field) =>
  (field as { admin?: { description?: unknown } }).admin?.description;

const flatten = (fields: Field[]): Field[] =>
  fields.flatMap((field) =>
    field.type === "group" || field.type === "array" ? [field, ...flatten(field.fields)] : [field],
  );

describe("metadata vocabularies", () => {
  test.each(Object.entries(VOCABULARIES))("%s uses lowercase snake_case values", (_, options) => {
    expect(valuesOf(options).filter((value) => !/^[a-z0-9]+(_[a-z0-9]+)*$/.test(value))).toEqual(
      [],
    );
  });

  test.each(Object.entries(VOCABULARIES))("%s has no duplicate value", (_, options) => {
    expect(new Set(valuesOf(options)).size).toBe(options.length);
  });

  test.each(Object.entries(VOCABULARIES))("%s labels every option", (_, options) => {
    expect(options.filter((option) => !option.label.trim())).toEqual([]);
  });

  /**
   * Pinned so that widening a vocabulary is a reviewed diff rather than a quiet edit. The MCP
   * branches on `aggregation` and the ingest maps the intake workbook onto all of these, so a new
   * value is a change to two contracts outside this repository.
   */
  test("pins the value of every vocabulary", () => {
    expect(valuesOf(AGGREGATION_OPTIONS)).toEqual([
      "sum",
      "mean",
      "area_weighted_mean",
      "min",
      "none",
    ]);
    expect(valuesOf(VALUE_TYPE_OPTIONS)).toEqual([
      "count",
      "area",
      "length",
      "distance",
      "ratio",
      "index",
      "density",
      "categorical",
    ]);
    expect(valuesOf(SENSITIVITY_OPTIONS)).toEqual([
      "public",
      "restricted",
      "restricted_review",
      "indigenous_data",
    ]);
    expect(valuesOf(UPDATE_CADENCE_OPTIONS)).toEqual([
      "monthly",
      "quarterly",
      "biannual",
      "annual",
      "irregular",
      "one_off",
      "unknown",
    ]);
    expect(valuesOf(SYNC_STATUS_OPTIONS)).toEqual(["ok", "error", "item_inaccessible"]);
    expect(valuesOf(ADMIN_LEVEL_OPTIONS)).toEqual(["0", "1", "2"]);
  });

  /**
   * The imagery resource block reduces a raster, so it can only ever offer a subset. AM-700 adds
   * the field with these three values inline; the follow-up is to have it import
   * IMAGERY_AGGREGATION_OPTIONS instead of keeping a second copy.
   */
  test("keeps the imagery aggregations a strict subset of the indicator ones", () => {
    const indicator = new Set(valuesOf(AGGREGATION_OPTIONS));

    expect(valuesOf(IMAGERY_AGGREGATION_OPTIONS)).toEqual(["sum", "mean", "none"]);
    expect(valuesOf(IMAGERY_AGGREGATION_OPTIONS).filter((v) => !indicator.has(v))).toEqual([]);
    expect(IMAGERY_AGGREGATION_OPTIONS.length).toBeLessThan(AGGREGATION_OPTIONS.length);
  });
});

describe("adminLevelsSupported", () => {
  test("aggregates upward only, never below the collection level", () => {
    expect(adminLevelsSupported("2")).toEqual(["0", "1", "2"]);
    expect(adminLevelsSupported("1")).toEqual(["0", "1"]);
    expect(adminLevelsSupported("0")).toEqual(["0"]);
  });

  test("treats an unset collection level as answerable everywhere", () => {
    // Every geometry layer, where a spatial intersection answers at any level. All 23 Ecuador
    // layers land here today; the 80 announced census layers are what makes the other branch load-bearing.
    expect(adminLevelsSupported()).toEqual(["0", "1", "2"]);
    expect(adminLevelsSupported(null)).toEqual(["0", "1", "2"]);
  });

  test("returns a fresh array, so a caller cannot mutate the vocabulary", () => {
    const levels = adminLevelsSupported();
    levels.pop();

    expect(adminLevelsSupported()).toHaveLength(3);
  });
});

describe("metadata fields", () => {
  test("exposes every group in one ordered contract", () => {
    expect(namesOf(MetadataFields)).toEqual([
      "aggregation",
      "value_type",
      "decimals",
      "spatial_coverage",
      "collected_at_level",
      "sensitivity",
      "ai_answerable",
      "caveats",
      "provenance",
      "sync",
    ]);
    expect(MetadataFields).toHaveLength(
      MeasurementFields.length + ScopeFields.length + GovernanceFields.length + 2,
    );
  });

  test("offers each select exactly its vocabulary", () => {
    const cases: [Field[], string, readonly VocabularyOption[]][] = [
      [MeasurementFields, "aggregation", AGGREGATION_OPTIONS],
      [MeasurementFields, "value_type", VALUE_TYPE_OPTIONS],
      [ScopeFields, "collected_at_level", ADMIN_LEVEL_OPTIONS],
      [GovernanceFields, "sensitivity", SENSITIVITY_OPTIONS],
      [ProvenanceFields.fields, "update_cadence", UPDATE_CADENCE_OPTIONS],
      [SyncFields.fields, "sync_status", SYNC_STATUS_OPTIONS],
    ];

    for (const [fields, name, vocabulary] of cases) {
      const field = byName(fields, name) as SelectField;

      expect(field.type).toBe("select");
      expect(field.options).toEqual([...vocabulary]);
    }
  });

  /**
   * Required fields are enforced in the ingest, not here. All ten are empty on all 164 rows, and a
   * required field on a populated collection makes every existing document unsaveable in the admin
   * without telling the editor which value the row is missing.
   */
  test("leaves everything optional until the intake workbook is filled", () => {
    expect(
      flatten(MetadataFields).filter((field) => "required" in field && field.required),
    ).toEqual([
      // The caveat text is the one exception: a caveat row with no text is an empty row, and the
      // editor added it deliberately.
      expect.objectContaining({ name: "text" }),
    ]);
  });

  /**
   * The table budget. Each entry is two Postgres tables plus, for a select, two enum types — and
   * the draft mirror on this collection doubles both. Adding a name here has to be worth that.
   */
  test("spends its multi-value budget on exactly two fields", () => {
    const multiValue = flatten(MetadataFields).filter(
      (field) => field.type === "array" || (field.type === "select" && field.hasMany),
    );

    expect(namesOf(multiValue)).toEqual(["spatial_coverage", "caveats"]);
  });

  test("keeps the job-written lists as json, which costs no table", () => {
    expect(byName(SyncFields.fields, "queryable_fields")?.type).toBe("json");
  });

  test("hides the sync group from the admin, so no value here is ever hand-typed", () => {
    expect(SyncFields.admin?.readOnly).toBe(true);
    expect(ProvenanceFields.admin?.readOnly).toBeFalsy();
  });

  test("defaults ai_answerable closed", () => {
    // A checkbox always holds a value, so the default is the ruling that applies to every row
    // nobody has reviewed.
    expect(byName(GovernanceFields, "ai_answerable")).toMatchObject({
      type: "checkbox",
      defaultValue: false,
    });
  });

  test("localizes the caveat text and nothing else", () => {
    const localized = flatten(MetadataFields).filter(
      (field) => "localized" in field && field.localized,
    );

    expect(namesOf(localized)).toEqual(["text"]);
    expect(
      byName((byName(GovernanceFields, "caveats") as ArrayField).fields, "text"),
    ).toMatchObject({ type: "textarea", required: true, localized: true });
  });

  test("bounds decimals to a display precision", () => {
    expect(byName(MeasurementFields, "decimals")).toMatchObject({ type: "number", min: 0, max: 6 });
    expect((byName(MeasurementFields, "decimals") as NumberField).hasMany).toBeFalsy();
  });

  test("documents every field it adds", () => {
    const undocumented = flatten(MetadataFields).filter(
      (field) => field.type !== "group" && field.type !== "array" && !describedBy(field),
    );

    // The six whose name is the whole answer. Everything else has to explain itself.
    expect(namesOf(undocumented)).toEqual([
      "text",
      "source_org",
      "source_url",
      "update_cadence",
      "synced_at",
      "sync_status",
    ]);
  });
});

describe("metadata fields against the collection they extend", () => {
  test("collides with no field already on the indicator", () => {
    const existing = new Set(namesOf(Indicators.fields));

    expect(namesOf(MetadataFields).filter((name) => existing.has(name))).toEqual([]);
  });

  test("collides with no key already on a source row", () => {
    // Ingest maps the JSON onto the collection by key, so a name that exists on both sides would
    // have the source row overwrite a curated value without anything being reported.
    const keys = new Set((INDICATORS as unknown as Record<string, unknown>[]).flatMap(Object.keys));

    expect(namesOf(MetadataFields).filter((name) => keys.has(name))).toEqual([]);
  });

  /**
   * Alpha-3, not alpha-2. `COUNTRIES` matches GADM's `GID_0`, which is what the data actually
   * carries; the intake workbook's Ecuador rows declare `EC`, so the import has to convert rather
   * than pass the value through.
   */
  test("offers spatial_coverage the project's own country codes", () => {
    const field = byName(ScopeFields, "spatial_coverage") as SelectField;

    expect(field.hasMany).toBe(true);
    expect(field.options).toEqual(COUNTRIES.map(({ code }) => ({ label: code, value: code })));
    expect(COUNTRIES.filter(({ code }) => !/^[A-Z]{3}$/.test(code))).toEqual([]);
  });

  test("is not wired in yet, so this commit needs no migration", () => {
    // Enabling is one line — `...MetadataFields` after `ResourceField` — and it has to ship with
    // the migration it generates, or every query against the collection hits columns that the
    // database does not have.
    expect(namesOf(Indicators.fields)).not.toContain("aggregation");
  });
});
