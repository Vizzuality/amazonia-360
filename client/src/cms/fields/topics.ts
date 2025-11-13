import { Field } from "payload";

import { BASEMAPS } from "@/constants/basemaps";

export const TopicsField: Field = {
  name: "topics",
  type: "array",
  fields: [
    {
      name: "topic_id",
      type: "number",
      unique: true,
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "indicators",
      type: "array",
      fields: [
        {
          name: "indicator_id",
          type: "number",
        },
        {
          name: "type",
          type: "radio",
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
        },
        {
          name: "y",
          label: "Y Coordinate",
          type: "number",
        },
        {
          name: "w",
          label: "Width",
          type: "number",
        },
        {
          name: "h",
          label: "Height",
          type: "number",
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
