import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reports_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  CREATE TYPE "public"."enum__reports_v_version_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  CREATE TABLE "reports_country" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_reports_country",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_reports_v_version_country" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__reports_v_version_country",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  ALTER TABLE "reports_country" ADD CONSTRAINT "reports_country_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_version_country" ADD CONSTRAINT "_reports_v_version_country_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reports_country_order_idx" ON "reports_country" USING btree ("order");
  CREATE INDEX "reports_country_parent_idx" ON "reports_country" USING btree ("parent_id");
  CREATE INDEX "_reports_v_version_country_order_idx" ON "_reports_v_version_country" USING btree ("order");
  CREATE INDEX "_reports_v_version_country_parent_idx" ON "_reports_v_version_country" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "reports_country" CASCADE;
  DROP TABLE "_reports_v_version_country" CASCADE;
  DROP TYPE "public"."enum_reports_country";
  DROP TYPE "public"."enum__reports_v_version_country";`)
}
