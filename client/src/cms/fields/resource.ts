import type { Block, Field } from "payload";

/** Required on `component` and `h3`, where every row populates it. */
const requiredNameField: Field = {
  name: "name",
  type: "text",
  required: true,
  admin: {
    description:
      "Machine name. Keys the COMPONENT_INDICATORS registry in containers/indicators/custom/index.tsx (`total-area`, `AMZ_LOCADM2`) — do not rename without checking that file.",
  },
};

/**
 * Optional on `feature`, `imagery`, `imagery-tile`, `web-tile` — empty on 14 source rows for
 * these types, and not read by any code. Do not make this required: see requiredNameField
 * for the block types where every row actually populates it.
 */
const nameField: Field = {
  name: "name",
  type: "text",
  admin: {
    description:
      "Display/machine name. Empty on 14 source rows; not read by any code for this resource type.",
  },
};

const urlField: Field = { name: "url", type: "text", required: true };

const queryField = (name: string): Field => ({
  name,
  type: "json",
  admin: {
    description: "ArcGIS __esri.QueryProperties, passed unmodified to `new Query()`.",
  },
});

const rasterFunctionField: Field = {
  name: "rasterFunction",
  type: "json",
  required: true,
  admin: { description: "ArcGIS __esri.RasterFunctionProperties, e.g. a Colormap function." },
};

const legendField: Field = {
  name: "legend",
  type: "group",
  fields: [
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "basic",
      options: [{ label: "Basic", value: "basic" }],
    },
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        { name: "label", type: "text", required: true, localized: true },
        {
          name: "color",
          type: "text",
          required: true,
          admin: { description: "Hex, e.g. #EEF0BA" },
        },
      ],
    },
  ],
};

export const FeatureResourceBlock: Block = {
  slug: "feature",
  labels: { singular: "Feature layer", plural: "Feature layers" },
  fields: [
    nameField,
    urlField,
    {
      name: "layer_id",
      type: "text",
      required: true,
      defaultValue: "0",
      admin: {
        description:
          "Text, not a number: lib/indicators.ts builds the layer URL as `url + layer_id`.",
      },
    },
    {
      name: "popupTemplate",
      type: "group",
      fields: [
        { name: "title", type: "text" },
        {
          name: "fieldInfos",
          type: "array",
          fields: [
            { name: "fieldName", type: "text", required: true },
            { name: "label", type: "text", required: true, localized: true },
          ],
        },
      ],
      admin: {
        description:
          "Rebuilt on read as { title, content: [{ type: 'fields', fieldInfos }] } — the only content shape present in the source data.",
      },
    },
    queryField("query_numeric"),
    queryField("query_table"),
    queryField("query_chart"),
    queryField("query_ai"),
  ],
};

export const ImageryResourceBlock: Block = {
  slug: "imagery",
  labels: { singular: "Imagery layer", plural: "Imagery layers" },
  fields: [nameField, urlField, rasterFunctionField, legendField],
};

export const ImageryTileResourceBlock: Block = {
  slug: "imagery-tile",
  labels: { singular: "Imagery tile layer", plural: "Imagery tile layers" },
  fields: [nameField, urlField, rasterFunctionField, legendField],
};

export const WebTileResourceBlock: Block = {
  slug: "web-tile",
  labels: { singular: "Web tile layer", plural: "Web tile layers" },
  fields: [nameField, urlField],
};

export const H3ResourceBlock: Block = {
  slug: "h3",
  labels: { singular: "H3 grid column", plural: "H3 grid columns" },
  fields: [
    requiredNameField,
    {
      name: "column",
      type: "text",
      required: true,
      admin: { description: "H3 variable name, matched against META.datasets[].var_name." },
    },
    { name: "url", type: "text" },
  ],
};

export const ComponentResourceBlock: Block = {
  slug: "component",
  labels: { singular: "Custom component", plural: "Custom components" },
  fields: [requiredNameField, queryField("query_ai")],
};

export const RESOURCE_BLOCKS: Block[] = [
  FeatureResourceBlock,
  ImageryResourceBlock,
  ImageryTileResourceBlock,
  WebTileResourceBlock,
  H3ResourceBlock,
  ComponentResourceBlock,
];

export const ResourceField: Field = {
  name: "resource",
  type: "blocks",
  required: true,
  minRows: 1,
  maxRows: 1,
  blocks: RESOURCE_BLOCKS,
  admin: { description: "Exactly one resource. The block type is the resource type." },
};
