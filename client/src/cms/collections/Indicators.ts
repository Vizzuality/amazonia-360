import type { CollectionConfig, RadioFieldValidation } from "payload";

import { COUNTRIES } from "@/lib/country";

import { catalogueAccess } from "@/cms/access/catalogue";
import { invalidDefaultMessage, isAllowedDefault } from "@/cms/fields/default-visualization-type";
import { ResourceField } from "@/cms/fields/resource";
import { sourceIdField } from "@/cms/fields/source-id";
import { autoIncrementSourceId } from "@/cms/hooks/auto-increment-source-id";
import { warnOnVisualizationMismatch } from "@/cms/hooks/indicator-visualization";

export const Indicators: CollectionConfig = {
  slug: "indicators",
  admin: {
    group: "Catalogue",
    useAsTitle: "name",
    defaultColumns: ["id", "name", "subtopic", "_status"],
  },
  access: catalogueAccess,
  versions: { drafts: true },
  fields: [
    sourceIdField,
    {
      name: "order",
      type: "number",
      required: true,
      admin: {
        description:
          "Display order within a subtopic. Not the same as the Source ID — they diverge on some rows.",
      },
    },
    { name: "subtopic", type: "relationship", relationTo: "subtopics", required: true },
    {
      name: "country",
      type: "select",
      options: COUNTRIES.map(({ code }) => ({ label: code, value: code })),
      admin: {
        description:
          "The country module this indicator belongs to. Empty is the Amazon Region — the regional scope, not every country.",
      },
    },
    /**
     * Recorded, never resolved: nothing reads this at render time, and a saved report holding
     * the regional Content Code keeps rendering the regional indicator in every module. ADR
     * 0004 has the reasoning, and the case that decides it.
     *
     * `filterOptions` does the two jobs `radio` could not do for `default_visualization_type`
     * below — it narrows the picker and validates the save — so the constraint holds for the
     * admin, the REST API and the seed from this one declaration.
     */
    {
      name: "replaces",
      type: "relationship",
      relationTo: "indicators",
      filterOptions: () => ({ country: { exists: false } }),
      admin: {
        condition: (data) => !!data?.country,
        description:
          "The regional indicator this one stands in for inside its module. Only regional indicators can be named.",
      },
    },
    { name: "name", type: "text", localized: true, required: true },
    {
      name: "unit",
      type: "text",
      localized: true,
      admin: { description: "e.g. km², m. Empty on 63 of 164 rows." },
    },
    { name: "description_short", type: "text", localized: true, required: true },
    {
      name: "description",
      type: "textarea",
      localized: true,
      admin: { description: "Markdown. Rendered with react-markdown in containers/info." },
    },
    {
      name: "visualization_types",
      type: "select",
      hasMany: true,
      options: [
        { label: "Map", value: "map" },
        { label: "Table", value: "table" },
        { label: "Chart", value: "chart" },
        { label: "Numeric", value: "numeric" },
      ],
      admin: {
        description:
          "Which widgets this indicator offers. Deliberately explicit, not derived: deriving would change 18 of 164 rows. Empty for all h3 indicators.",
      },
    },
    /**
     * Stays a `radio` on purpose, and that is why it takes two pieces to constrain.
     *
     * The value must be one of the indicator's own `visualization_types`; a default outside
     * them is a badge the sidebar can never draw. A `select` gets that for free through
     * `filterOptions`, which both narrows the options and validates the save — but `radio`
     * has no `filterOptions`. So the rule is enforced here by `validate`, which covers the
     * admin, the REST API and the seed, and mirrored on screen by the field component. Both
     * read the same function; see `cms/fields/default-visualization-type.ts`.
     */
    {
      name: "default_visualization_type",
      type: "radio",
      required: false,
      options: [
        { label: "Map", value: "map" },
        { label: "Table", value: "table" },
        { label: "Chart", value: "chart" },
        { label: "Numeric", value: "numeric" },
      ],
      validate: ((value, { options, siblingData }) => {
        if (typeof value !== "string" || value === "") return true;

        const { visualization_types } = (siblingData ?? {}) as { visualization_types?: unknown };

        return (
          isAllowedDefault(value, options, visualization_types) || invalidDefaultMessage(value)
        );
      }) satisfies RadioFieldValidation,
      admin: {
        description: "The visualization type the sidebar badges as default. Optional.",
        components: {
          Field: "/cms/components/default-visualization-type-field#DefaultVisualizationTypeField",
        },
      },
    },
    ResourceField,
  ],
  hooks: {
    beforeChange: [warnOnVisualizationMismatch],
    beforeValidate: [autoIncrementSourceId],
  },
};
