import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_indicators_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUF', 'GUY', 'PER', 'SUR', 'VEN');
  CREATE TYPE "public"."enum__indicators_v_version_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUF', 'GUY', 'PER', 'SUR', 'VEN');
  ALTER TABLE "indicators" ADD COLUMN "country" "enum_indicators_country";
  ALTER TABLE "indicators" ADD COLUMN "replaces_id" varchar;
  ALTER TABLE "_indicators_v" ADD COLUMN "version_country" "enum__indicators_v_version_country";
  ALTER TABLE "_indicators_v" ADD COLUMN "version_replaces_id" varchar;
  ALTER TABLE "indicators" ADD CONSTRAINT "indicators_replaces_id_indicators_id_fk" FOREIGN KEY ("replaces_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_version_replaces_id_indicators_id_fk" FOREIGN KEY ("version_replaces_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "indicators_replaces_idx" ON "indicators" USING btree ("replaces_id");
  CREATE INDEX "_indicators_v_version_version_replaces_idx" ON "_indicators_v" USING btree ("version_replaces_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "indicators" DROP CONSTRAINT "indicators_replaces_id_indicators_id_fk";
  
  ALTER TABLE "_indicators_v" DROP CONSTRAINT "_indicators_v_version_replaces_id_indicators_id_fk";
  
  DROP INDEX "indicators_replaces_idx";
  DROP INDEX "_indicators_v_version_version_replaces_idx";
  ALTER TABLE "indicators" DROP COLUMN "country";
  ALTER TABLE "indicators" DROP COLUMN "replaces_id";
  ALTER TABLE "_indicators_v" DROP COLUMN "version_country";
  ALTER TABLE "_indicators_v" DROP COLUMN "version_replaces_id";
  DROP TYPE "public"."enum_indicators_country";
  DROP TYPE "public"."enum__indicators_v_version_country";`)
}
