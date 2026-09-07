import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The 27 imagery rows of `datum/indicators.json`, keyed by the legacy id ingest writes to
 * `indicators.legacy_id`. Inlined rather than imported so the migration keeps recording what the
 * data said when it ran, even after the JSON is retired in favour of the CMS.
 */
const AGGREGATIONS = sql`
       (7, 'none'), (13, 'none'), (14, 'none'), (35, 'sum'), (37, 'mean'),
       (39, 'sum'), (41, 'sum'), (42, 'sum'), (43, 'sum'), (44, 'sum'),
       (45, 'sum'), (46, 'sum'), (47, 'sum'), (48, 'sum'), (49, 'sum'),
       (50, 'sum'), (119, 'none'), (122, 'sum'), (123, 'sum'), (124, 'sum'),
       (125, 'sum'), (126, 'sum'), (127, 'sum'), (128, 'none'), (129, 'none'),
       (163, 'none'), (165, 'none')`;

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // `IS NULL` only: an editor may have overruled the authored value in the admin UI after ingest,
  // and the JSON is not the source of truth once a row exists in the CMS.
  await db.execute(sql`
   UPDATE "indicators_blocks_imagery" AS "block"
   SET "aggregation" = "authored"."aggregation"::"public"."enum_indicators_blocks_imagery_aggregation"
   FROM (VALUES
${AGGREGATIONS}
   ) AS "authored"("legacy_id", "aggregation")
   JOIN "indicators" ON "indicators"."legacy_id" = "authored"."legacy_id"
   WHERE "block"."_parent_id" = "indicators"."id" AND "block"."aggregation" IS NULL;`);

  await db.execute(sql`
   UPDATE "_indicators_v_blocks_imagery" AS "block"
   SET "aggregation" = "authored"."aggregation"::"public"."enum__indicators_v_blocks_imagery_aggregation"
   FROM (VALUES
${AGGREGATIONS}
   ) AS "authored"("legacy_id", "aggregation")
   JOIN "_indicators_v" ON "_indicators_v"."version_legacy_id" = "authored"."legacy_id"
   WHERE "block"."_parent_id" = "_indicators_v"."id" AND "block"."aggregation" IS NULL;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Intentionally empty: rolling back goes on to drop the column these values were written to.
}
