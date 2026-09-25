import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_countries_of_interest" AS ENUM('BRA', 'COL', 'PER', 'VEN', 'ECU', 'BOL', 'GUY', 'SUR');
  CREATE TABLE "users_countries_of_interest" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_users_countries_of_interest",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  ALTER TABLE "users_countries_of_interest" ADD CONSTRAINT "users_countries_of_interest_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_countries_of_interest_order_idx" ON "users_countries_of_interest" USING btree ("order");
  CREATE INDEX "users_countries_of_interest_parent_idx" ON "users_countries_of_interest" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_countries_of_interest" CASCADE;
  DROP TYPE "public"."enum_users_countries_of_interest";`)
}
