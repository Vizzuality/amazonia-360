import type { CollectionConfig } from "payload";

import SUBTOPICS from "@/../datum/subtopics.json";
import TOPICS from "@/../datum/topics.json";
import { findFieldByName, isEmptyValue, namedFields } from "@/cms/test-utils/find-field";

import { Subtopics } from "./Subtopics";
import { Topics } from "./Topics";

const LOCALES = ["en", "es", "pt"] as const;

type SourceRow = Record<string, unknown> & { id: number };

const topics = TOPICS as unknown as SourceRow[];
const subtopics = SUBTOPICS as unknown as SourceRow[];

const localizedRequiredFields = (collection: CollectionConfig) =>
  namedFields(collection.fields).filter((field) => field.required && field.localized);

/**
 * Missing translations per collection, as `{ "<field>_<locale>": count }`.
 *
 * These are contract gaps, not schema bugs: `required` says the field must eventually be
 * filled, and phase 2 seeds the missing values. The test fails if the gap grows or shrinks
 * unexpectedly, which is what makes the debt visible instead of forgotten.
 */
const EXPECTED_TRANSLATION_DEBT: Record<string, Record<string, number>> = {
  topics: {},
  subtopics: { name_es: 28, name_pt: 28 },
};

describe.each([
  { label: "Topics", collection: Topics, slug: "topics", rows: topics },
  { label: "Subtopics", collection: Subtopics, slug: "subtopics", rows: subtopics },
])("$label", ({ collection, slug, rows }) => {
  test("uses the expected slug", () => {
    expect(collection.slug).toBe(slug);
  });

  test("enables drafts so a bad catalogue edit can be rolled back", () => {
    expect(collection.versions).toEqual({ drafts: true });
  });

  test("restricts read to published documents for everyone except admins", () => {
    const anonymous = { req: { user: null } } as never;
    const admin = { req: { user: { collection: "admins" } } } as never;
    const signedInUser = { req: { user: { collection: "users" } } } as never;

    expect(collection.access?.read?.(anonymous)).toEqual({ _status: { equals: "published" } });
    // The owner-directed case: a signed-in non-admin still only sees published content.
    expect(collection.access?.read?.(signedInUser)).toEqual({
      _status: { equals: "published" },
    });
    expect(collection.access?.read?.(admin)).toBe(true);

    for (const operation of ["create", "update", "delete"] as const) {
      expect(collection.access?.[operation]?.(anonymous)).toBe(false);
      expect(collection.access?.[operation]?.(signedInUser)).toBe(false);
      expect(collection.access?.[operation]?.(admin)).toBe(true);
    }
  });

  test("groups under Catalogue in the admin UI", () => {
    expect(collection.admin?.group).toBe("Catalogue");
    expect(collection.admin?.useAsTitle).toBe("name");
  });

  test("keeps legacy_id required, unique and immutable", () => {
    const legacyId = findFieldByName(collection.fields, "legacy_id");

    expect(legacyId?.type).toBe("number");
    expect(legacyId).toMatchObject({ required: true, unique: true, index: true });
    expect(legacyId?.access?.update?.({} as never)).toBe(false);
  });

  test("every legacy_id in the source data is a unique number", () => {
    const ids = rows.map((row) => row.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => typeof id === "number")).toBe(true);
  });

  test("localizes name and description instead of keeping _en/_es/_pt triples", () => {
    expect(findFieldByName(collection.fields, "name")?.localized).toBe(true);
    expect(findFieldByName(collection.fields, "description")?.localized).toBe(true);
    expect(findFieldByName(collection.fields, "name_en")).toBeUndefined();
    expect(findFieldByName(collection.fields, "description_pt")).toBeUndefined();
  });

  test("drops the dead Numerotation field", () => {
    expect(findFieldByName(collection.fields, "Numerotation")).toBeUndefined();
  });

  test("carries the shared default_visualization array", () => {
    expect(findFieldByName(collection.fields, "default_visualization")?.type).toBe("array");
  });

  test("every required localized field has an `en` value on every row, so the seed can create it", () => {
    // Payload validates `required` against the request locale only. Seeding writes `en`,
    // so a populated `en` value is the invariant that makes phase 2 possible.
    const violations: string[] = [];

    for (const field of localizedRequiredFields(collection)) {
      for (const row of rows) {
        if (!isEmptyValue(row[`${field.name}_en`])) continue;
        violations.push(`${slug} ${row.id}: required "${field.name}_en" is empty`);
      }
    }

    expect(violations).toEqual([]);
  });

  test("declares the phase-2 translation debt for required localized fields", () => {
    // Not a defect: `required` states the contract. These are the gaps phase 2 must seed
    // before the ES/PT admin tabs become saveable.
    const debt: Record<string, number> = {};

    for (const field of localizedRequiredFields(collection)) {
      for (const locale of LOCALES) {
        const missing = rows.filter((row) => isEmptyValue(row[`${field.name}_${locale}`])).length;
        if (missing > 0) debt[`${field.name}_${locale}`] = missing;
      }
    }

    expect(debt).toEqual(EXPECTED_TRANSLATION_DEBT[slug]);
  });
});

describe("Subtopics", () => {
  test("relates to topics rather than storing a numeric topic_id", () => {
    const topic = findFieldByName(Subtopics.fields, "topic");

    expect(topic).toMatchObject({ type: "relationship", relationTo: "topics", required: true });
    expect(findFieldByName(Subtopics.fields, "topic_id")).toBeUndefined();
  });

  test("every topic_id in the source data resolves to a topic", () => {
    const topicIds = new Set(topics.map((topic) => topic.id));

    expect(subtopics.filter((subtopic) => !topicIds.has(subtopic.topic_id as number))).toEqual([]);
  });

  test("requires name, and every row has an English value so the seed can create it", () => {
    expect(findFieldByName(Subtopics.fields, "name")).toMatchObject({
      required: true,
      localized: true,
    });
    expect(subtopics.every((subtopic) => !isEmptyValue(subtopic.name_en))).toBe(true);
  });

  test("leaves description optional, since it is empty in every locale on every row", () => {
    expect(findFieldByName(Subtopics.fields, "description")?.required).toBeFalsy();
    expect(
      subtopics.every((subtopic) =>
        LOCALES.every((locale) => isEmptyValue(subtopic[`description_${locale}`])),
      ),
    ).toBe(true);
  });

  test("omits image, which is empty on every subtopic", () => {
    expect(findFieldByName(Subtopics.fields, "image")).toBeUndefined();
    expect(subtopics.every((subtopic) => isEmptyValue(subtopic.image))).toBe(true);
  });
});

describe("Topics", () => {
  test("requires name, which is populated in all three locales on all 9 rows", () => {
    expect(findFieldByName(Topics.fields, "name")?.required).toBe(true);
  });

  test("keeps image as a path string rather than a Media upload", () => {
    expect(findFieldByName(Topics.fields, "image")?.type).toBe("text");
  });
});
