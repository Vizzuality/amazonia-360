import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // "_reports_v"."parent_id" is ON DELETE SET NULL, not cascade, so these rows
  // outlive the report they version instead of going with it. They have to be
  // deleted first: after the report is gone "parent_id" is NULL and nothing
  // ties them back to an anonymous owner any more.
  await db.execute(sql`
    DELETE FROM "_reports_v" WHERE "parent_id" IN (
      SELECT "parent_id" FROM "reports_rels" WHERE "anonymous_users_id" IS NOT NULL
    );
  `);

  // Anonymous access is gone, so the reports those sessions owned have no
  // owner left and no way to be reached. Delete them before the column that
  // identifies them is dropped.
  await db.execute(sql`
    DELETE FROM "reports" WHERE "id" IN (
      SELECT "parent_id" FROM "reports_rels" WHERE "anonymous_users_id" IS NOT NULL
    );
  `);

  // Every surviving draft belongs to a real account. My Reports only lists
  // published reports and the nightly draft cleanup is gone, so leaving them
  // as drafts would make them permanently invisible. Both tables: Payload
  // keeps draft state in the main table and the version table, and updating
  // only one leaves the admin panel disagreeing with the app.
  await db.execute(sql`
    UPDATE "reports" SET "_status" = 'published' WHERE "_status" = 'draft';
  `);
  await db.execute(sql`
    UPDATE "_reports_v" SET "version__status" = 'published' WHERE "version__status" = 'draft';
  `);

  // The four DROP CONSTRAINT statements run ahead of the DROP TABLE block,
  // which is not the order Payload generated. DROP TABLE "anonymous_users"
  // CASCADE drops those foreign keys itself, and dropping an already-dropped
  // constraint aborts the whole statement — keep this order if the DDL below
  // is ever regenerated.
  await db.execute(sql`
   ALTER TABLE "anonymous_users" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reports_rels" DROP CONSTRAINT "reports_rels_anonymous_users_fk";

  ALTER TABLE "_reports_v_rels" DROP CONSTRAINT "_reports_v_rels_anonymous_users_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_anonymous_users_fk";

  ALTER TABLE "payload_preferences_rels" DROP CONSTRAINT "payload_preferences_rels_anonymous_users_fk";

  DROP TABLE "anonymous_users" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP INDEX "reports_rels_anonymous_users_id_idx";
  DROP INDEX "_reports_v_rels_anonymous_users_id_idx";
  DROP INDEX "payload_locked_documents_rels_anonymous_users_id_idx";
  DROP INDEX "payload_preferences_rels_anonymous_users_id_idx";
  ALTER TABLE "reports_rels" DROP COLUMN "anonymous_users_id";
  ALTER TABLE "_reports_v_rels" DROP COLUMN "anonymous_users_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "anonymous_users_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN "anonymous_users_id";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Structural rollback only. The reports deleted by `up` are gone, and the
  // drafts it published do not remember they were drafts.
  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'CleanAnonymousUsers', 'CleanDraftReports');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'CleanAnonymousUsers', 'CleanDraftReports');
  CREATE TABLE "anonymous_users" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );

  CREATE TABLE "payload_jobs" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"meta" jsonb,
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
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "anonymous_users_id" uuid;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "anonymous_users_id" uuid;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "anonymous_users_updated_at_idx" ON "anonymous_users" USING btree ("updated_at");
  CREATE INDEX "anonymous_users_created_at_idx" ON "anonymous_users" USING btree ("created_at");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reports_rels_anonymous_users_id_idx" ON "reports_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "_reports_v_rels_anonymous_users_id_idx" ON "_reports_v_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "payload_locked_documents_rels_anonymous_users_id_idx" ON "payload_locked_documents_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "payload_preferences_rels_anonymous_users_id_idx" ON "payload_preferences_rels" USING btree ("anonymous_users_id");`)
}
