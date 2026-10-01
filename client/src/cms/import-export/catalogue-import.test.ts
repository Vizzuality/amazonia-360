import { Indicators } from "@/cms/collections/Indicators";
import { Subtopics } from "@/cms/collections/Subtopics";
import { Topics } from "@/cms/collections/Topics";
import { findFieldByName } from "@/cms/test-utils/find-field";

import { CATALOGUE_IMPORT_CONTEXT, rejectInvalidImportRow } from "./catalogue-import";
import { IMPORT_ROW_ERRORS } from "./prepare-import-rows";

const validate = (data: Record<string, unknown>, importing = true) =>
  rejectInvalidImportRow({
    data,
    operation: "create",
    req: { context: importing ? { [CATALOGUE_IMPORT_CONTEXT]: true } : {} },
  } as never);

describe("rejectInvalidImportRow", () => {
  test("fails a flagged row with its own messages, which the import lists against that row", () => {
    expect(() =>
      validate({
        name: "Forest loss",
        [IMPORT_ROW_ERRORS]: ["Content Code (`id`) is missing.", "`_status` is missing."],
      }),
    ).toThrow("Content Code (`id`) is missing. `_status` is missing.");
  });

  test("lets a clean row through untouched", () => {
    const row = { id: "900", name: "Forest loss" };

    expect(validate(row)).toBe(row);
  });
});

describe.each([
  { label: "Topics", collection: Topics },
  { label: "Subtopics", collection: Subtopics },
  { label: "Indicators", collection: Indicators },
])("$label", ({ collection }) => {
  test("rejects flagged import rows and no longer hands out Content Codes", () => {
    expect(collection.hooks?.beforeValidate).toEqual([rejectInvalidImportRow]);
  });
});

describe.each([
  { label: "Topics", collection: Topics, join: "subtopics" },
  { label: "Subtopics", collection: Subtopics, join: "indicators" },
])("$label", ({ collection, join }) => {
  test(`leaves the ${join} join out of import and export, as it is stored on the other side`, () => {
    expect(findFieldByName(collection.fields, join)?.custom).toEqual({
      "plugin-import-export": { disabled: true },
    });
  });
});
