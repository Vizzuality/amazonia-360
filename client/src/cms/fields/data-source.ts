import type { Field } from "payload";

import { requiredInDefaultLocale } from "@/cms/fields/validation";

/**
 * An Indicator's data source, modelled as a set of mutually exclusive kinds.
 *
 * Deliberately not one flat form with optional fields. The source JSON was a
 * flat table export where every row carried every column, which is how one
 * Indicator ended up with a raster setting on a feature layer that has no
 * raster — nothing caught it. Blocks capped at a single row make that
 * combination impossible to express rather than merely hidden.
 */

/**
 * Labels shown on the map popup and in the legend are translatable.
 *
 * Required in English only. These are seeded with English and translated later,
 * so a plain `required` would reject every save made while another locale is
 * active — including saves that have nothing to do with the label.
 */
const translatableLabel: Field = {
  name: "label",
  type: "text",
  localized: true,
  validate: requiredInDefaultLocale("Label"),
};

const popupField: Field = {
  name: "popup",
  type: "group",
  admin: {
    description: "Optional. Shown when a feature is clicked on the map.",
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      admin: {
        description:
          "Either an ArcGIS field substitution such as {NOMBCAP} or literal text. Substitution tokens must not contain spaces or they resolve to nothing.",
      },
    },
    {
      name: "fields",
      type: "array",
      labels: { singular: "Field", plural: "Fields" },
      fields: [{ name: "fieldName", type: "text", required: true }, translatableLabel],
    },
  ],
};

const legendField: Field = {
  name: "legend",
  type: "group",
  fields: [
    {
      name: "type",
      type: "text",
      defaultValue: "basic",
    },
    {
      name: "items",
      type: "array",
      labels: { singular: "Legend item", plural: "Legend items" },
      fields: [{ name: "color", type: "text", required: true }, translatableLabel],
    },
  ],
};

/** ArcGIS query definitions, stored as JSON because they are passed through verbatim. */
const queriesField: Field = {
  name: "queries",
  type: "group",
  admin: {
    description: "ArcGIS query definitions, passed to the service unchanged.",
  },
  fields: [
    { name: "table", type: "json" },
    { name: "chart", type: "json" },
    { name: "numeric", type: "json" },
    { name: "ai", type: "json" },
  ],
};

export const DataSourceField: Field = {
  name: "dataSource",
  type: "blocks",
  required: true,
  minRows: 1,
  // Exactly one. This is the constraint that makes an Indicator unable to hold
  // attributes from two different kinds.
  maxRows: 1,
  labels: { singular: "Data source", plural: "Data source" },
  admin: {
    description: "Exactly one data source. Pick the kind that matches the service.",
  },
  blocks: [
    {
      slug: "feature",
      labels: { singular: "Feature layer", plural: "Feature layers" },
      fields: [
        {
          name: "name",
          type: "text",
          admin: {
            description: "Optional label for the service. 14 Indicators have none.",
          },
        },
        { name: "url", type: "text", required: true },
        {
          name: "layerId",
          type: "text",
          required: true,
          admin: { description: "Layer index appended to the service URL." },
        },
        queriesField,
        popupField,
      ],
    },
    {
      slug: "imagery",
      labels: { singular: "Imagery layer", plural: "Imagery layers" },
      fields: [
        {
          name: "name",
          type: "text",
          admin: {
            description: "Optional label for the service. 14 Indicators have none.",
          },
        },
        { name: "url", type: "text", required: true },
        { name: "rasterFunction", type: "text" },
        legendField,
      ],
    },
    {
      slug: "h3",
      labels: { singular: "H3 grid column", plural: "H3 grid columns" },
      fields: [
        {
          name: "name",
          type: "text",
          admin: {
            description: "Optional label for the service. 14 Indicators have none.",
          },
        },
        {
          name: "column",
          type: "text",
          required: true,
          admin: { description: "Column in the H3 grid tiles." },
        },
        { name: "url", type: "text" },
      ],
    },
    {
      slug: "component",
      labels: { singular: "Built-in component", plural: "Built-in components" },
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: { description: "Identifier of the component that renders this indicator." },
        },
      ],
    },
  ],
};
