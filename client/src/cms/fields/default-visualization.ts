import type { Field } from "payload";

import { BASEMAPS } from "@/constants/basemaps";

const showForMapsOnly = {
  condition: (_: unknown, siblingData: { type?: string }) => siblingData.type === "map",
};

/**
 * Mirrors `cms/fields/topics.ts` (the Reports collection's equivalent field): clears
 * `basemapId`/`opacity` on save when the widget is not a map, so switching a widget's
 * `type` away from `map` doesn't leave a stale value behind that the UI no longer shows.
 */
const clearWhenNotMap = ({
  value,
  siblingData,
}: {
  value?: unknown;
  siblingData?: { type?: string };
}) => (siblingData?.type !== "map" ? null : value);

/**
 * The pre-configured widget layout for a topic or subtopic.
 *
 * Deliberately NOT shared with `cms/fields/topics.ts` (used by Reports): that field
 * stores `indicator_id` as a raw number to match untouched reports data, whereas this
 * one uses a relationship. Unifying them belongs to the deferred reports migration.
 */
export const DefaultVisualizationField: Field = {
  name: "default_visualization",
  type: "array",
  labels: { singular: "Default visualization", plural: "Default visualizations" },
  fields: [
    {
      name: "indicator",
      type: "relationship",
      relationTo: "indicators",
      required: true,
    },
    {
      name: "type",
      type: "radio",
      required: true,
      options: [
        { label: "Map", value: "map" },
        { label: "Chart", value: "chart" },
        { label: "Table", value: "table" },
        { label: "Numeric", value: "numeric" },
        { label: "Custom", value: "custom" },
        { label: "Ai", value: "ai" },
      ],
      admin: {
        description:
          "The source data only uses map, numeric, chart and table; custom and ai exist to match Reports.",
      },
    },
    { name: "x", label: "X Coordinate", type: "number", required: true },
    { name: "y", label: "Y Coordinate", type: "number", required: true },
    { name: "w", label: "Width", type: "number", required: true },
    { name: "h", label: "Height", type: "number", required: true },
    {
      name: "basemapId",
      type: "radio",
      required: false,
      options: BASEMAPS.map((basemap) => ({ label: basemap.id, value: basemap.id })),
      defaultValue: "gray-vector",
      admin: showForMapsOnly,
      hooks: { beforeChange: [clearWhenNotMap] },
    },
    {
      name: "opacity",
      type: "number",
      required: false,
      defaultValue: 1,
      admin: showForMapsOnly,
      hooks: { beforeChange: [clearWhenNotMap] },
    },
  ],
};
