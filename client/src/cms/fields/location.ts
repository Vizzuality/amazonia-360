import { Field } from "payload";

export const LocationField: Field = {
  name: "location",
  label: "Location",
  type: "json",
  required: true,
  admin: {
    description: "The location of the feature, represented as a GeoJSON object.",
  },
  jsonSchema: {
    // The way the following two properties are defined is required to indicate that we will use a local schema
    uri: "a://b/location.json", // required
    fileMatch: ["a://b/location.json"], // required
    schema: {
      type: "object",
      oneOf: [
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "search",
            },
            key: {
              oneOf: [{ type: "string" }, { type: "number" }],
            },
            text: {
              type: "string",
            },
            sourceIndex: {
              type: "number",
            },
          },
          required: ["type", "key", "text", "sourceIndex"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["point", "multipoint", "polyline", "polygon", "multipatch", "extent"],
            },
            geometry: {
              type: "object",
              additionalProperties: true,
            },
            buffer: {
              type: "number",
            },
          },
          required: ["type", "geometry", "buffer"],
          additionalProperties: false,
        },
      ],
    },
  },
};
