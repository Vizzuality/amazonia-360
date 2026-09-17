import type { Field, GroupField } from "payload";

import { COUNTRIES } from "@/lib/country";

import {
  ADMIN_LEVEL_OPTIONS,
  AGGREGATION_OPTIONS,
  SENSITIVITY_OPTIONS,
  SYNC_STATUS_OPTIONS,
  UPDATE_CADENCE_OPTIONS,
  VALUE_TYPE_OPTIONS,
} from "./metadata-vocabularies";

/**
 * The indicator metadata the MCP catalogue needs and the CMS does not hold yet.
 *
 * Nothing here is wired into `collections/Indicators.ts`. This module is the contract only: the
 * field shapes are settled and pinned by `metadata.test.ts`, and enabling them is a separate step
 * that has to ship its own migration in the same commit, because declared columns that the
 * database lacks break every query against the collection.
 *
 * Three rules shaped what follows, and they are worth keeping when this list grows.
 *
 * 1. Additive only. `unit` stays the localized text field it is today. Turning it into a closed
 *    vocabulary is a defensible change — 101 indicators use about 15 distinct symbols and 79% of
 *    the strings are identical across the three locales — but it rewrites existing data, so it
 *    belongs in its own migration and not in a commit that only adds columns.
 *
 * 2. Nothing is `required`. Every field below is empty on all 164 rows today and stays empty on
 *    most of them until the intake workbook comes back filled. A required field on a collection
 *    with existing rows makes those rows unsaveable in the admin. Completeness is enforced where
 *    it can report which row failed and why — in the ingest and in tests — not by a constraint
 *    that only bites the editor who opens the document next.
 *
 * 3. Multi-value fields are counted, not assumed. Postgres pays two tables and two enum types for
 *    every `hasMany` select, doubled again by the `_v` draft mirror this collection carries:
 *    `visualization_types` alone produced `indicators_visualization_types`,
 *    `_indicators_v_version_visualization_types` and their enums in migration 20260803_090559. A
 *    scalar field costs two columns and no table. So a list that a person curates gets the real
 *    field, and a list the sync job writes and nobody hand-edits gets `json` — the precedent is
 *    already here, in the `query_numeric` / `query_table` / `query_chart` fields of the resource
 *    block. Applied across these fields that is six new tables rather than eighteen.
 */

/** What the number means, and what a tool is allowed to do with it. */
export const MeasurementFields: Field[] = [
  {
    name: "aggregation",
    type: "select",
    options: [...AGGREGATION_OPTIONS],
    admin: {
      description:
        "How to reduce this indicator to one number over the area asked about. The imagery resource block carries its own three-value copy of this (AM-700); once both exist they must be read from metadata-vocabularies.ts rather than typed twice.",
    },
  },
  {
    name: "value_type",
    type: "select",
    options: [...VALUE_TYPE_OPTIONS],
    admin: {
      description:
        "What kind of quantity this is. Lets a tool refuse a meaningless operation before running it. Not the same as unit: an area and a distance can both be in km.",
    },
  },
  {
    name: "decimals",
    type: "number",
    min: 0,
    max: 6,
    admin: { description: "Display precision. Presentation only — never applied before a sum." },
  },
];

/** Where the indicator can be asked about, and at what resolution. */
export const ScopeFields: Field[] = [
  {
    name: "spatial_coverage",
    type: "select",
    hasMany: true,
    options: COUNTRIES.map(({ code }) => ({ label: code, value: code })),
    admin: {
      description:
        "Countries the indicator actually has data for, so a tool stops offering it where there is none. Coverage is not the same as reach: the municipality layer names Peru but only covers 8 of its 19 departments.",
    },
  },
  {
    name: "collected_at_level",
    type: "select",
    options: [...ADMIN_LEVEL_OPTIONS],
    admin: {
      description:
        "The administrative level the data was collected at. Only for census-style data that arrives already aggregated by unit — leave empty on every geometry layer, where a spatial intersection answers at any level. Stated by the source, not a judgement call. adminLevelsSupported() in metadata-vocabularies.ts derives the answerable levels from it.",
    },
  },
];

/**
 * What a person has ruled about publishing this indicator.
 *
 * `ai_answerable` defaults to false on purpose. A checkbox always holds a value, so the default is
 * the ruling that applies to every row nobody has looked at, and the only safe reading of "nobody
 * has looked at it" is that a generated answer may not quote it.
 */
export const GovernanceFields: Field[] = [
  {
    name: "sensitivity",
    type: "select",
    options: [...SENSITIVITY_OPTIONS],
    admin: {
      description:
        "Set by a person, deliberately not matched from the indicator name: a keyword list finds sensitive names, not sensitive content.",
    },
  },
  {
    name: "ai_answerable",
    type: "checkbox",
    defaultValue: false,
    admin: {
      description:
        "Whether a generated answer may quote this indicator. Off until someone says otherwise.",
    },
  },
  {
    name: "caveats",
    type: "array",
    labels: { singular: "Caveat", plural: "Caveats" },
    fields: [{ name: "text", type: "textarea", required: true, localized: true }],
    admin: {
      description:
        "One known defect per row, written by a person and carried into the answer unchanged — never composed by the model. The case this exists for: the municipality layer stores ASQKM and DENS as 0 for all 143 Peruvian municipalities, so the honest output of that query is otherwise “Bagua has 0 km²”.",
    },
  },
];

/**
 * Where the data came from. Filled once at intake from the workbook's Sources sheet.
 *
 * A group rather than a `sources` collection, and that was a measurement rather than a preference:
 * across the 187 intake rows only 4 sources are shared by more than one indicator, and all 4 are
 * H3 CSVs. The 60 feature and 27 imagery services are one service per indicator. A relationship
 * that is 1:1 in 183 of 187 cases buys no deduplication and costs a whole collection — its own
 * table, locales table, draft mirror and rels table. A group flattens to `provenance_*` columns and
 * costs no table at all.
 */
export const ProvenanceFields: GroupField = {
  name: "provenance",
  type: "group",
  fields: [
    { name: "source_org", type: "text" },
    { name: "source_url", type: "text" },
    {
      name: "license",
      type: "textarea",
      admin: { description: "Plain text, 159 to 293 characters across the 60 regional services." },
    },
    {
      name: "source_citation",
      type: "textarea",
      admin: { description: "Authors, DOIs and URLs. What the traceability record publishes." },
    },
    {
      name: "data_vintage",
      type: "text",
      admin: {
        description:
          "The year or range of the data itself, e.g. 2020 or 2015-2020. NOT when the layer was last touched — for that see the Sync group. Curated, because it is not derivable: 84 of 88 layer descriptions contain a four-digit year and only 56 of those are the data date, and the ISO metadata document every feature service publishes has an empty temporal extent on all 12 checked.",
      },
    },
    {
      name: "update_cadence",
      type: "select",
      options: [...UPDATE_CADENCE_OPTIONS],
    },
    {
      name: "method_url",
      type: "text",
      admin: {
        description:
          "Link to the method or paper. Absent on all 88 layers today. Better left visibly empty than filled with the service URL.",
      },
    },
  ],
};

/**
 * What the ArcGIS sync job writes. Read-only in the admin so these never get hand-typed: a value a
 * person typed here is indistinguishable from one the job fetched, and only one of the two can be
 * re-checked against the source.
 *
 * `admin.readOnly` governs the UI alone, so the job writes through the local API as normal.
 */
export const SyncFields: GroupField = {
  name: "sync",
  type: "group",
  admin: { readOnly: true },
  fields: [
    {
      name: "arcgis_item_id",
      type: "text",
      admin: {
        description:
          "serviceItemId from the service ?f=json. Present on all 87 services, imagery included, and the key to everything else in this group.",
      },
    },
    {
      name: "queryable_fields",
      type: "json",
      admin: {
        description:
          "The attribute fields a tool may filter or group by. json, not an array: the job writes it and nobody edits it. Without the list the model invents field names — assuming GID_1 returns 400 “outFields parameter is invalid”, because that field exists in none of the three administrative layers. Empty for imagery, which is expected for a raster.",
      },
    },
    {
      name: "layer_last_edit",
      type: "date",
      admin: {
        description:
          "editingInfo.dataLastEditDate. Read it for what it is: on 12 of 14 layers checked all three editingInfo timestamps are identical, meaning the layer was republished wholesale rather than edited. Absent on all 27 imagery layers — an ImageServer has no editingInfo, no timeInfo and no modification date by any route.",
      },
    },
    {
      name: "schema_last_edit",
      type: "date",
      admin: {
        description:
          "editingInfo.schemaLastEditDate. The trigger for re-reading queryable_fields: if the schema moved, the cached field list is stale.",
      },
    },
    {
      name: "item_modified",
      type: "date",
      admin: { description: "When the ArcGIS Online item was touched. Not the age of the data." },
    },
    { name: "synced_at", type: "date" },
    { name: "sync_status", type: "select", options: [...SYNC_STATUS_OPTIONS] },
  ],
};

/**
 * The whole contract, in the order it should appear on the document.
 *
 * Spread into `Indicators.fields` after `ResourceField` when the enabling commit lands.
 */
export const MetadataFields: Field[] = [
  ...MeasurementFields,
  ...ScopeFields,
  ...GovernanceFields,
  ProvenanceFields,
  SyncFields,
];
