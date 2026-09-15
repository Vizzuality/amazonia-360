import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE IF EXISTS "anonymous_users" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE IF EXISTS "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "anonymous_users" CASCADE;
  DROP TABLE IF EXISTS "payload_jobs_stats" CASCADE;
  ALTER TABLE "reports_rels" DROP CONSTRAINT IF EXISTS "reports_rels_anonymous_users_fk";

  ALTER TABLE "_reports_v_rels" DROP CONSTRAINT IF EXISTS "_reports_v_rels_anonymous_users_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_anonymous_users_fk";

  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT IF EXISTS "payload_preferences_rels_anonymous_users_fk";

  DELETE FROM "payload_jobs_log" WHERE "task_slug" IN ('CleanAnonymousUsers', 'CleanDraftReports');
  DELETE FROM "payload_jobs" WHERE "task_slug" IN ('CleanAnonymousUsers', 'CleanDraftReports');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE IF EXISTS "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "reports_rels_anonymous_users_id_idx";
  DROP INDEX IF EXISTS "_reports_v_rels_anonymous_users_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_anonymous_users_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_anonymous_users_id_idx";
  ALTER TABLE "reports_rels" DROP COLUMN IF EXISTS "anonymous_users_id";
  ALTER TABLE "_reports_v_rels" DROP COLUMN IF EXISTS "anonymous_users_id";
  ALTER TABLE "payload_jobs" DROP COLUMN IF EXISTS "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "anonymous_users_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "anonymous_users_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'CleanAnonymousUsers' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'CleanDraftReports' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'CleanAnonymousUsers' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'CleanDraftReports' BEFORE 'createCollectionExport';
  CREATE TABLE "anonymous_users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "reports_rels" ADD COLUMN "anonymous_users_id" uuid;
  ALTER TABLE "_reports_v_rels" ADD COLUMN "anonymous_users_id" uuid;
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "anonymous_users_id" uuid;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "anonymous_users_id" uuid;
  CREATE INDEX "anonymous_users_updated_at_idx" ON "anonymous_users" USING btree ("updated_at");
  CREATE INDEX "anonymous_users_created_at_idx" ON "anonymous_users" USING btree ("created_at");
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reports_rels_anonymous_users_id_idx" ON "reports_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "_reports_v_rels_anonymous_users_id_idx" ON "_reports_v_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "payload_locked_documents_rels_anonymous_users_id_idx" ON "payload_locked_documents_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "payload_preferences_rels_anonymous_users_id_idx" ON "payload_preferences_rels" USING btree ("anonymous_users_id");`)
}
