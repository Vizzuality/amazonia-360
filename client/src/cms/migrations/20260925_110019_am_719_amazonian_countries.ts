import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "users_countries_of_interest" WHERE "value"::text IN ('GUF', 'PRY');
  ALTER TABLE "users_countries_of_interest" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_countries_of_interest";
  CREATE TYPE "public"."enum_users_countries_of_interest" AS ENUM('BRA', 'COL', 'PER', 'VEN', 'ECU', 'BOL', 'GUY', 'SUR');
  ALTER TABLE "users_countries_of_interest" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_countries_of_interest" USING "value"::"public"."enum_users_countries_of_interest";
  ALTER TABLE "reports_country" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_reports_country";
  CREATE TYPE "public"."enum_reports_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  ALTER TABLE "reports_country" ALTER COLUMN "value" SET DATA TYPE "public"."enum_reports_country" USING "value"::"public"."enum_reports_country";
  ALTER TABLE "_reports_v_version_country" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum__reports_v_version_country";
  CREATE TYPE "public"."enum__reports_v_version_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  ALTER TABLE "_reports_v_version_country" ALTER COLUMN "value" SET DATA TYPE "public"."enum__reports_v_version_country" USING "value"::"public"."enum__reports_v_version_country";
  ALTER TABLE "indicators" ALTER COLUMN "country" SET DATA TYPE text;
  DROP TYPE "public"."enum_indicators_country";
  CREATE TYPE "public"."enum_indicators_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  ALTER TABLE "indicators" ALTER COLUMN "country" SET DATA TYPE "public"."enum_indicators_country" USING "country"::"public"."enum_indicators_country";
  ALTER TABLE "_indicators_v" ALTER COLUMN "version_country" SET DATA TYPE text;
  DROP TYPE "public"."enum__indicators_v_version_country";
  CREATE TYPE "public"."enum__indicators_v_version_country" AS ENUM('ECU', 'BOL', 'BRA', 'COL', 'GUY', 'PER', 'SUR', 'VEN');
  ALTER TABLE "_indicators_v" ALTER COLUMN "version_country" SET DATA TYPE "public"."enum__indicators_v_version_country" USING "version_country"::"public"."enum__indicators_v_version_country";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_countries_of_interest" ADD VALUE 'GUF';
  ALTER TYPE "public"."enum_users_countries_of_interest" ADD VALUE 'PRY';
  ALTER TYPE "public"."enum_reports_country" ADD VALUE 'GUF' BEFORE 'GUY';
  ALTER TYPE "public"."enum__reports_v_version_country" ADD VALUE 'GUF' BEFORE 'GUY';
  ALTER TYPE "public"."enum_indicators_country" ADD VALUE 'GUF' BEFORE 'GUY';
  ALTER TYPE "public"."enum__indicators_v_version_country" ADD VALUE 'GUF' BEFORE 'GUY';`)
}
