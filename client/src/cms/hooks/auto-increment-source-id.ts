import type { CollectionBeforeValidateHook } from "payload";

export const autoIncrementSourceId: CollectionBeforeValidateHook = async ({
  collection,
  data,
  operation,
  req,
}) => {
  if (operation !== "create" || data?.id) return data;

  const result = await req.payload.db.execute({
    drizzle: req.payload.db.drizzle,
    raw: `SELECT MAX(id::integer) AS max_id FROM "${collection.slug}"`,
  });

  return { ...data, id: String(Number(result.rows[0].max_id) + 1) };
};
