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
      name: "indicators",
      type: "array",
      required: true,
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
