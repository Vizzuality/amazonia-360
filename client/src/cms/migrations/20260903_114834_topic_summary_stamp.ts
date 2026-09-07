import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reports_topics_locales" ADD COLUMN "description_stamp_indicator_ids" jsonb;
  ALTER TABLE "reports_topics_locales" ADD COLUMN "description_stamp_location_hash" varchar;
  ALTER TABLE "_reports_v_version_topics_locales" ADD COLUMN "description_stamp_indicator_ids" jsonb;
  ALTER TABLE "_reports_v_version_topics_locales" ADD COLUMN "description_stamp_location_hash" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reports_topics_locales" DROP COLUMN "description_stamp_indicator_ids";
  ALTER TABLE "reports_topics_locales" DROP COLUMN "description_stamp_location_hash";
  ALTER TABLE "_reports_v_version_topics_locales" DROP COLUMN "description_stamp_indicator_ids";
  ALTER TABLE "_reports_v_version_topics_locales" DROP COLUMN "description_stamp_location_hash";`)
}
