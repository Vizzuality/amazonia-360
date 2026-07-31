import type { CollectionBeforeValidateHook, CollectionSlug } from "payload";

/**
 * Assigns the next numeric id when one is not supplied.
 *
 * The content collections keep their original numeric ids because saved reports
 * and shared report URLs reference those numbers. Declaring a custom `id` field
 * of type `number` makes Payload's postgres adapter create a plain `numeric`
 * primary key with **no sequence and no default** — unlike the `serial` column
 * it uses when a collection has no custom id. Without this hook an editor
 * creating a record in the admin would hit a null primary key.
 *
 * Explicit ids are respected, which is what lets the migration load records
 * under their original numbers.
 *
 * Two creates racing could pick the same id. Acceptable here: writes are
 * admin-only and occasional. If that changes, back this with a sequence seeded
 * above the highest existing id.
 */
export const assignNextNumericId =
  (collection: CollectionSlug): CollectionBeforeValidateHook =>
  async ({ data, operation, req }) => {
    if (operation !== "create") return data;
    if (typeof data?.id === "number") return data;

    const highest = await req.payload.find({
      collection,
      sort: "-id",
      limit: 1,
      depth: 0,
      overrideAccess: true,
      // Drafts live in the main table too, so they must count towards the max
      // or a published record could later collide with a draft's id.
      draft: true,
    });

    const currentMax = highest.docs[0]?.id;

    return {
      ...data,
      id: typeof currentMax === "number" ? currentMax + 1 : 0,
    };
  };
