import type { Field } from "payload";

import { Indicators } from "@/cms/collections/Indicators";
import { Subtopics } from "@/cms/collections/Subtopics";

import { exportFieldPaths } from "./export-field-paths";

describe("exportFieldPaths", () => {
  test("lists every field of an indicator, so a default export can be imported back whole", () => {
    expect(exportFieldPaths(Indicators.fields)).toEqual([
      "id",
      "order",
      "subtopic",
      "country",
      "module",
      "partners",
      "replaces",
      "name",
      "unit",
      "description_short",
      "description",
      "visualization_types",
      "default_visualization_type",
      "resource",
    ]);
  });

  test("leaves out what the plugin is told to skip", () => {
    expect(exportFieldPaths(Subtopics.fields, ["indicators"])).not.toContain("indicators");
  });

  test("reaches into groups and tabs the way the plugin's own picker does", () => {
    expect(
      exportFieldPaths([
        { name: "meta", type: "group", fields: [{ name: "title", type: "text" }] },
        {
          type: "tabs",
          tabs: [
            { name: "seo", fields: [{ name: "slug", type: "text" }] },
            { label: "Plain", fields: [{ name: "note", type: "text" }] },
          ],
        },
        { name: "blocks", type: "blocks", blocks: [] },
        { name: "preview", type: "ui", admin: { components: {} } },
      ] as Field[]),
    ).toEqual(["meta.title", "seo.slug", "note", "blocks"]);
  });
});
