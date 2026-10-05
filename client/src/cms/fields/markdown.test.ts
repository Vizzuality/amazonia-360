import { readFileSync } from "node:fs";
import path from "node:path";

import type { TextareaField } from "payload";

import { Indicators } from "@/cms/collections/Indicators";
import { Subtopics } from "@/cms/collections/Subtopics";
import { Topics } from "@/cms/collections/Topics";
import { findFieldByName } from "@/cms/test-utils/find-field";

import { MARKDOWN_FIELD_COMPONENT } from "./markdown";

describe.each([
  { label: "Topics", collection: Topics },
  { label: "Subtopics", collection: Subtopics },
  { label: "Indicators", collection: Indicators },
])("$label description", ({ collection }) => {
  const description = findFieldByName(collection.fields, "description") as TextareaField;

  test("stays a localized textarea, so the API keeps returning a Markdown string", () => {
    expect(description.type).toBe("textarea");
    expect(description.localized).toBe(true);
  });

  test("is edited with the Markdown editor", () => {
    expect(description.admin?.components?.Field).toBe(MARKDOWN_FIELD_COMPONENT);
  });
});

test("the Markdown editor is in the admin import map", () => {
  // Payload resolves admin components through the generated map (`payload generate:importmap`);
  // a path missing from it renders an error in place of the field. Read as text, because
  // importing the map loads every admin component and their stylesheets.
  const importMap = readFileSync(
    path.resolve(__dirname, "../../app/(payload)/admin/importMap.js"),
    "utf8",
  );

  expect(importMap).toContain(JSON.stringify(MARKDOWN_FIELD_COMPONENT));
});

test("indicators.description_short stays plain text", () => {
  const field = findFieldByName(Indicators.fields, "description_short") as TextareaField;

  expect(field.type).toBe("text");
  expect(field.admin?.components?.Field).toBeUndefined();
});
