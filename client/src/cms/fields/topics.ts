import { Field } from "payload";

import { BASEMAPS } from "@/constants/basemaps";

export const TopicsField: Field = {
  name: "topics",
  type: "array",
  fields: [
    {
      name: "topic_id",
      type: "number",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "description_stamp",
      type: "group",
      // Localized alongside `description`: each locale holds its own summary, so a regeneration in
      // one language must not mark the others up to date.
      localized: true,
      admin: {
        readOnly: true,
        description:
          "What the report looked like when the AI summary was generated. Written by the app; the report editor compares it against the live report to offer a regeneration. See TopicSummaryStamp in app/(frontend)/parsers.ts.",
      },
      fields: [
        {
          name: "indicator_ids",
          type: "json",
          // Without this a `json` field generates the widest possible union in payload-types.ts,
          // and every read site would have to narrow it back to the array it always is.
          typescriptSchema: [() => ({ type: "array", items: { type: "number" } })],
          admin: { description: "The topic's indicator ids at generation time, sorted." },
        },
        { name: "location_hash", type: "text" },
      ],
    },
    {
      name: "indicators",
      type: "array",
      fields: [
        {
          name: "indicator_id",
          type: "number",
          required: true,
        },
        {
          name: "type",
          type: "radio",
          required: true,
          options: [
            {
              label: "Map",
              value: "map",
            },
            {
              label: "Chart",
              value: "chart",
            },
            {
              label: "Table",
              value: "table",
            },
            {
              label: "Numeric",
              value: "numeric",
            },
            {
              label: "Custom",
              value: "custom",
            },
            {
              label: "Ai",
              value: "ai",
            },
          ],
        },
        {
          name: "x",
          label: "X Coordinate",
          type: "number",
          required: true,
        },
        {
          name: "y",
          label: "Y Coordinate",
          type: "number",
          required: true,
        },
        {
          name: "w",
          label: "Width",
          type: "number",
          required: true,
        },
        {
          name: "h",
          label: "Height",
          type: "number",
          required: true,
        },
        {
          name: "basemapId",
          type: "radio",
          required: false,
          options: BASEMAPS.map((basemap) => ({
            label: basemap.id,
            value: basemap.id,
          })),
          defaultValue: "gray-vector",
          admin: {
            condition: (_, siblingData) => {
              return siblingData.type === "map";
            },
          },
          hooks: {
            beforeChange: [
              ({ value, siblingData }) => {
                if (siblingData.type !== "map") return null;

                return value;
              },
            ],
          },
        },
        {
          name: "opacity",
          type: "number",
          required: false,
          defaultValue: 1,
          admin: {
            condition: (_, siblingData) => {
              return siblingData.type === "map";
            },
          },
          hooks: {
            beforeChange: [
              ({ value, siblingData }) => {
                if (siblingData.type !== "map") return null;

                return value;
              },
            ],
          },
        },
      ],
    },
  ],
};
