import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_payload_jobs_log_parent_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport');
  CREATE TYPE "public"."enum_payload_llm_instructions_entity_type" AS ENUM('collection', 'global');
  CREATE TABLE "payload_llm_instructions" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"entity_slug" varchar NOT NULL,
  	"entity_type" "enum_payload_llm_instructions_entity_type" NOT NULL,
  	"additional_instructions" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_llm_instructions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"admins_id" uuid,
  	"users_id" uuid
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DROP INDEX "reports_topics_locales_locale_parent_id_unique";
  DROP INDEX "reports__status_idx";
  DROP INDEX "reports_locales_locale_parent_id_unique";
  DROP INDEX "_reports_v_version_topics_locales_locale_parent_id_unique";
  DROP INDEX "_reports_v_version_version__status_idx";
  DROP INDEX "_reports_v_snapshot_idx";
  DROP INDEX "_reports_v_locales_locale_parent_id_unique";
  DROP INDEX "topics__status_idx";
  DROP INDEX "topics_locales_locale_parent_id_unique";
  DROP INDEX "_topics_v_version_version__status_idx";
  DROP INDEX "_topics_v_snapshot_idx";
  DROP INDEX "_topics_v_locales_locale_parent_id_unique";
  DROP INDEX "subtopics__status_idx";
  DROP INDEX "subtopics_locales_locale_parent_id_unique";
  DROP INDEX "_subtopics_v_version_version__status_idx";
  DROP INDEX "_subtopics_v_snapshot_idx";
  DROP INDEX "_subtopics_v_locales_locale_parent_id_unique";
  DROP INDEX "country_modules_locales_locale_parent_id_unique";
  DROP INDEX "partners_locales_locale_parent_id_unique";
  DROP INDEX "indicators_blocks_imagery_legend_items_locales_locale_parent";
  DROP INDEX "indicators_blocks_imagery_tile_legend_items_locales_locale_p";
  DROP INDEX "indicators__status_idx";
  DROP INDEX "indicators_locales_locale_parent_id_unique";
  DROP INDEX "_indicators_v_blocks_imagery_legend_items_locales_locale_par";
  DROP INDEX "_indicators_v_blocks_imagery_tile_legend_items_locales_local";
  DROP INDEX "_indicators_v_version_version__status_idx";
  DROP INDEX "_indicators_v_snapshot_idx";
  DROP INDEX "_indicators_v_locales_locale_parent_id_unique";
  DROP INDEX "payload_jobs_processing_idx";
  DROP INDEX "indicators_blocks_feature_popup_template_field_infos_local_1";
  DROP INDEX "_indicators_v_blocks_feature_popup_template_field_infos_loca";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "input" SET NOT NULL;
  ALTER TABLE "media" ADD COLUMN "original_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "original_url" varchar;
  ALTER TABLE "media" ADD COLUMN "original_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "original_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "original_width" numeric;
  ALTER TABLE "media" ADD COLUMN "original_height" numeric;
  ALTER TABLE "media" ADD COLUMN "original_prefix" varchar;
  ALTER TABLE "media" ADD COLUMN "original__objectkey" varchar;
  ALTER TABLE "reports_locales" ADD COLUMN "_status" "enum_reports_status" DEFAULT 'draft';
  ALTER TABLE "_reports_v_locales" ADD COLUMN "version__status" "enum__reports_v_version_status" DEFAULT 'draft';
  ALTER TABLE "topics_locales" ADD COLUMN "_status" "enum_topics_status" DEFAULT 'draft';
  ALTER TABLE "_topics_v_locales" ADD COLUMN "version__status" "enum__topics_v_version_status" DEFAULT 'draft';
  ALTER TABLE "subtopics_locales" ADD COLUMN "_status" "enum_subtopics_status" DEFAULT 'draft';
  ALTER TABLE "_subtopics_v_locales" ADD COLUMN "version__status" "enum__subtopics_v_version_status" DEFAULT 'draft';
  ALTER TABLE "indicators_locales" ADD COLUMN "_status" "enum_indicators_status" DEFAULT 'draft';
  ALTER TABLE "_indicators_v_locales" ADD COLUMN "version__status" "enum__indicators_v_version_status" DEFAULT 'draft';
  ALTER TABLE "exports" ADD COLUMN "original_filename" varchar;
  ALTER TABLE "exports" ADD COLUMN "original_url" varchar;
  ALTER TABLE "exports" ADD COLUMN "original_mime_type" varchar;
  ALTER TABLE "exports" ADD COLUMN "original_filesize" numeric;
  ALTER TABLE "exports" ADD COLUMN "original_width" numeric;
  ALTER TABLE "exports" ADD COLUMN "original_height" numeric;
  ALTER TABLE "exports" ADD COLUMN "original_prefix" varchar;
  ALTER TABLE "exports" ADD COLUMN "original__objectkey" varchar;
  ALTER TABLE "imports" ADD COLUMN "original_filename" varchar;
  ALTER TABLE "imports" ADD COLUMN "original_url" varchar;
  ALTER TABLE "imports" ADD COLUMN "original_mime_type" varchar;
  ALTER TABLE "imports" ADD COLUMN "original_filesize" numeric;
  ALTER TABLE "imports" ADD COLUMN "original_width" numeric;
  ALTER TABLE "imports" ADD COLUMN "original_height" numeric;
  ALTER TABLE "imports" ADD COLUMN "original_prefix" varchar;
  ALTER TABLE "imports" ADD COLUMN "original__objectkey" varchar;
  ALTER TABLE "payload_jobs_log" ADD COLUMN "parent_task_slug" "enum_payload_jobs_log_parent_task_slug";
  ALTER TABLE "payload_jobs_log" ADD COLUMN "parent_task_i_d" varchar;
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_jobs" ADD COLUMN "processing_until" timestamp(3) with time zone;
  ALTER TABLE "payload_jobs" ADD COLUMN "processing_token" varchar;
  ALTER TABLE "payload_jobs" ADD COLUMN "concurrency_key" varchar;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_llm_instructions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_admins_fk" FOREIGN KEY ("admins_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_llm_instructions_rels" ADD CONSTRAINT "payload_llm_instructions_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_llm_instructions_entity_slug_idx" ON "payload_llm_instructions" USING btree ("entity_slug");
  CREATE INDEX "payload_llm_instructions_updated_at_idx" ON "payload_llm_instructions" USING btree ("updated_at");
  CREATE INDEX "payload_llm_instructions_created_at_idx" ON "payload_llm_instructions" USING btree ("created_at");
  CREATE INDEX "payload_llm_instructions_rels_order_idx" ON "payload_llm_instructions_rels" USING btree ("order");
  CREATE INDEX "payload_llm_instructions_rels_parent_idx" ON "payload_llm_instructions_rels" USING btree ("parent_id");
  CREATE INDEX "payload_llm_instructions_rels_path_idx" ON "payload_llm_instructions_rels" USING btree ("path");
  CREATE INDEX "payload_llm_instructions_rels_admins_id_idx" ON "payload_llm_instructions_rels" USING btree ("admins_id");
  CREATE INDEX "payload_llm_instructions_rels_users_id_idx" ON "payload_llm_instructions_rels" USING btree ("users_id");
  CREATE INDEX "media_original_original_filename_idx" ON "media" USING btree ("original_filename");
  CREATE UNIQUE INDEX "reports_topics_locales_parent_id_locale_unique" ON "reports_topics_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "reports__status_idx" ON "reports_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "reports_locales_parent_id_locale_unique" ON "reports_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "_reports_v_version_topics_locales_parent_id_locale_unique" ON "_reports_v_version_topics_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_reports_v_version_version__status_idx" ON "_reports_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_reports_v_locales_parent_id_locale_unique" ON "_reports_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "topics__status_idx" ON "topics_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "topics_locales_parent_id_locale_unique" ON "topics_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_topics_v_version_version__status_idx" ON "_topics_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_topics_v_locales_parent_id_locale_unique" ON "_topics_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "subtopics__status_idx" ON "subtopics_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "subtopics_locales_parent_id_locale_unique" ON "subtopics_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_subtopics_v_version_version__status_idx" ON "_subtopics_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_subtopics_v_locales_parent_id_locale_unique" ON "_subtopics_v_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "country_modules_locales_parent_id_locale_unique" ON "country_modules_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "partners_locales_parent_id_locale_unique" ON "partners_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_legend_items_locales_parent_id_loc" ON "indicators_blocks_imagery_legend_items_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_tile_legend_items_locales_parent_i" ON "indicators_blocks_imagery_tile_legend_items_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "indicators__status_idx" ON "indicators_locales" USING btree ("_status","_locale");
  CREATE UNIQUE INDEX "indicators_locales_parent_id_locale_unique" ON "indicators_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_legend_items_locales_parent_id_" ON "_indicators_v_blocks_imagery_legend_items_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_tile_legend_items_locales_paren" ON "_indicators_v_blocks_imagery_tile_legend_items_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "_indicators_v_version_version__status_idx" ON "_indicators_v_locales" USING btree ("version__status","_locale");
  CREATE UNIQUE INDEX "_indicators_v_locales_parent_id_locale_unique" ON "_indicators_v_locales" USING btree ("_parent_id","_locale");
  CREATE INDEX "exports_original_original_filename_idx" ON "exports" USING btree ("original_filename");
  CREATE INDEX "imports_original_original_filename_idx" ON "imports" USING btree ("original_filename");
  CREATE INDEX "payload_jobs_processing_until_idx" ON "payload_jobs" USING btree ("processing_until");
  CREATE INDEX "payload_jobs_concurrency_key_idx" ON "payload_jobs" USING btree ("concurrency_key");
  CREATE UNIQUE INDEX "indicators_blocks_feature_popup_template_field_infos_local_1" ON "indicators_blocks_feature_popup_template_field_infos_locales" USING btree ("_parent_id","_locale");
  CREATE UNIQUE INDEX "_indicators_v_blocks_feature_popup_template_field_infos_loca" ON "_indicators_v_blocks_feature_popup_template_field_infos_locales" USING btree ("_parent_id","_locale");
  UPDATE "reports_locales" l SET "_status" = p."_status" FROM "reports" p WHERE p."id" = l."_parent_id";
  UPDATE "topics_locales" l SET "_status" = p."_status" FROM "topics" p WHERE p."id" = l."_parent_id";
  UPDATE "subtopics_locales" l SET "_status" = p."_status" FROM "subtopics" p WHERE p."id" = l."_parent_id";
  UPDATE "indicators_locales" l SET "_status" = p."_status" FROM "indicators" p WHERE p."id" = l."_parent_id";
  UPDATE "_reports_v_locales" l SET "version__status" = v."version__status" FROM "_reports_v" v WHERE v."id" = l."_parent_id";
  UPDATE "_topics_v_locales" l SET "version__status" = v."version__status" FROM "_topics_v" v WHERE v."id" = l."_parent_id";
  UPDATE "_subtopics_v_locales" l SET "version__status" = v."version__status" FROM "_subtopics_v" v WHERE v."id" = l."_parent_id";
  UPDATE "_indicators_v_locales" l SET "version__status" = v."version__status" FROM "_indicators_v" v WHERE v."id" = l."_parent_id";
  ALTER TABLE "reports" DROP COLUMN "_status";
  ALTER TABLE "_reports_v" DROP COLUMN "version__status";
  ALTER TABLE "_reports_v" DROP COLUMN "snapshot";
  ALTER TABLE "topics" DROP COLUMN "_status";
  ALTER TABLE "_topics_v" DROP COLUMN "version__status";
  ALTER TABLE "_topics_v" DROP COLUMN "snapshot";
  ALTER TABLE "subtopics" DROP COLUMN "_status";
  ALTER TABLE "_subtopics_v" DROP COLUMN "version__status";
  ALTER TABLE "_subtopics_v" DROP COLUMN "snapshot";
  ALTER TABLE "indicators" DROP COLUMN "_status";
  ALTER TABLE "_indicators_v" DROP COLUMN "version__status";
  ALTER TABLE "_indicators_v" DROP COLUMN "snapshot";
  ALTER TABLE "payload_jobs" DROP COLUMN "processing";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_llm_instructions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_llm_instructions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload_llm_instructions" CASCADE;
  DROP TABLE "payload_llm_instructions_rels" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  DROP INDEX "media_original_original_filename_idx";
  DROP INDEX "reports_topics_locales_parent_id_locale_unique";
  DROP INDEX "reports__status_idx";
  DROP INDEX "reports_locales_parent_id_locale_unique";
  DROP INDEX "_reports_v_version_topics_locales_parent_id_locale_unique";
  DROP INDEX "_reports_v_version_version__status_idx";
  DROP INDEX "_reports_v_locales_parent_id_locale_unique";
  DROP INDEX "topics__status_idx";
  DROP INDEX "topics_locales_parent_id_locale_unique";
  DROP INDEX "_topics_v_version_version__status_idx";
  DROP INDEX "_topics_v_locales_parent_id_locale_unique";
  DROP INDEX "subtopics__status_idx";
  DROP INDEX "subtopics_locales_parent_id_locale_unique";
  DROP INDEX "_subtopics_v_version_version__status_idx";
  DROP INDEX "_subtopics_v_locales_parent_id_locale_unique";
  DROP INDEX "country_modules_locales_parent_id_locale_unique";
  DROP INDEX "partners_locales_parent_id_locale_unique";
  DROP INDEX "indicators_blocks_imagery_legend_items_locales_parent_id_loc";
  DROP INDEX "indicators_blocks_imagery_tile_legend_items_locales_parent_i";
  DROP INDEX "indicators__status_idx";
  DROP INDEX "indicators_locales_parent_id_locale_unique";
  DROP INDEX "_indicators_v_blocks_imagery_legend_items_locales_parent_id_";
  DROP INDEX "_indicators_v_blocks_imagery_tile_legend_items_locales_paren";
  DROP INDEX "_indicators_v_version_version__status_idx";
  DROP INDEX "_indicators_v_locales_parent_id_locale_unique";
  DROP INDEX "exports_original_original_filename_idx";
  DROP INDEX "imports_original_original_filename_idx";
  DROP INDEX "payload_jobs_processing_until_idx";
  DROP INDEX "payload_jobs_concurrency_key_idx";
  DROP INDEX "indicators_blocks_feature_popup_template_field_infos_local_1";
  DROP INDEX "_indicators_v_blocks_feature_popup_template_field_infos_loca";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "input" DROP NOT NULL;
  ALTER TABLE "reports" ADD COLUMN "_status" "enum_reports_status" DEFAULT 'draft';
  ALTER TABLE "_reports_v" ADD COLUMN "version__status" "enum__reports_v_version_status" DEFAULT 'draft';
  ALTER TABLE "_reports_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "topics" ADD COLUMN "_status" "enum_topics_status" DEFAULT 'draft';
  ALTER TABLE "_topics_v" ADD COLUMN "version__status" "enum__topics_v_version_status" DEFAULT 'draft';
  ALTER TABLE "_topics_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "subtopics" ADD COLUMN "_status" "enum_subtopics_status" DEFAULT 'draft';
  ALTER TABLE "_subtopics_v" ADD COLUMN "version__status" "enum__subtopics_v_version_status" DEFAULT 'draft';
  ALTER TABLE "_subtopics_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "indicators" ADD COLUMN "_status" "enum_indicators_status" DEFAULT 'draft';
  ALTER TABLE "_indicators_v" ADD COLUMN "version__status" "enum__indicators_v_version_status" DEFAULT 'draft';
  ALTER TABLE "_indicators_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "payload_jobs" ADD COLUMN "processing" boolean DEFAULT false;
  UPDATE "reports" p SET "_status" = l."_status" FROM "reports_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
  UPDATE "topics" p SET "_status" = l."_status" FROM "topics_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
  UPDATE "subtopics" p SET "_status" = l."_status" FROM "subtopics_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
  UPDATE "indicators" p SET "_status" = l."_status" FROM "indicators_locales" l WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
  UPDATE "_reports_v" v SET "version__status" = l."version__status" FROM "_reports_v_locales" l WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';
  UPDATE "_topics_v" v SET "version__status" = l."version__status" FROM "_topics_v_locales" l WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';
  UPDATE "_subtopics_v" v SET "version__status" = l."version__status" FROM "_subtopics_v_locales" l WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';
  UPDATE "_indicators_v" v SET "version__status" = l."version__status" FROM "_indicators_v_locales" l WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';
  CREATE UNIQUE INDEX "reports_topics_locales_locale_parent_id_unique" ON "reports_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "reports__status_idx" ON "reports" USING btree ("_status");
  CREATE UNIQUE INDEX "reports_locales_locale_parent_id_unique" ON "reports_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_reports_v_version_topics_locales_locale_parent_id_unique" ON "_reports_v_version_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_reports_v_version_version__status_idx" ON "_reports_v" USING btree ("version__status");
  CREATE INDEX "_reports_v_snapshot_idx" ON "_reports_v" USING btree ("snapshot");
  CREATE UNIQUE INDEX "_reports_v_locales_locale_parent_id_unique" ON "_reports_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "topics__status_idx" ON "topics" USING btree ("_status");
  CREATE UNIQUE INDEX "topics_locales_locale_parent_id_unique" ON "topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_topics_v_version_version__status_idx" ON "_topics_v" USING btree ("version__status");
  CREATE INDEX "_topics_v_snapshot_idx" ON "_topics_v" USING btree ("snapshot");
  CREATE UNIQUE INDEX "_topics_v_locales_locale_parent_id_unique" ON "_topics_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subtopics__status_idx" ON "subtopics" USING btree ("_status");
  CREATE UNIQUE INDEX "subtopics_locales_locale_parent_id_unique" ON "subtopics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_subtopics_v_version_version__status_idx" ON "_subtopics_v" USING btree ("version__status");
  CREATE INDEX "_subtopics_v_snapshot_idx" ON "_subtopics_v" USING btree ("snapshot");
  CREATE UNIQUE INDEX "_subtopics_v_locales_locale_parent_id_unique" ON "_subtopics_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "country_modules_locales_locale_parent_id_unique" ON "country_modules_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_legend_items_locales_locale_parent" ON "indicators_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_tile_legend_items_locales_locale_p" ON "indicators_blocks_imagery_tile_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators__status_idx" ON "indicators" USING btree ("_status");
  CREATE UNIQUE INDEX "indicators_locales_locale_parent_id_unique" ON "indicators_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_legend_items_locales_locale_par" ON "_indicators_v_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_tile_legend_items_locales_local" ON "_indicators_v_blocks_imagery_tile_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_version_version__status_idx" ON "_indicators_v" USING btree ("version__status");
  CREATE INDEX "_indicators_v_snapshot_idx" ON "_indicators_v" USING btree ("snapshot");
  CREATE UNIQUE INDEX "_indicators_v_locales_locale_parent_id_unique" ON "_indicators_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE UNIQUE INDEX "indicators_blocks_feature_popup_template_field_infos_local_1" ON "indicators_blocks_feature_popup_template_field_infos_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_feature_popup_template_field_infos_loca" ON "_indicators_v_blocks_feature_popup_template_field_infos_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "media" DROP COLUMN "original_filename";
  ALTER TABLE "media" DROP COLUMN "original_url";
  ALTER TABLE "media" DROP COLUMN "original_mime_type";
  ALTER TABLE "media" DROP COLUMN "original_filesize";
  ALTER TABLE "media" DROP COLUMN "original_width";
  ALTER TABLE "media" DROP COLUMN "original_height";
  ALTER TABLE "media" DROP COLUMN "original_prefix";
  ALTER TABLE "media" DROP COLUMN "original__objectkey";
  ALTER TABLE "reports_locales" DROP COLUMN "_status";
  ALTER TABLE "_reports_v_locales" DROP COLUMN "version__status";
  ALTER TABLE "topics_locales" DROP COLUMN "_status";
  ALTER TABLE "_topics_v_locales" DROP COLUMN "version__status";
  ALTER TABLE "subtopics_locales" DROP COLUMN "_status";
  ALTER TABLE "_subtopics_v_locales" DROP COLUMN "version__status";
  ALTER TABLE "indicators_locales" DROP COLUMN "_status";
  ALTER TABLE "_indicators_v_locales" DROP COLUMN "version__status";
  ALTER TABLE "exports" DROP COLUMN "original_filename";
  ALTER TABLE "exports" DROP COLUMN "original_url";
  ALTER TABLE "exports" DROP COLUMN "original_mime_type";
  ALTER TABLE "exports" DROP COLUMN "original_filesize";
  ALTER TABLE "exports" DROP COLUMN "original_width";
  ALTER TABLE "exports" DROP COLUMN "original_height";
  ALTER TABLE "exports" DROP COLUMN "original_prefix";
  ALTER TABLE "exports" DROP COLUMN "original__objectkey";
  ALTER TABLE "imports" DROP COLUMN "original_filename";
  ALTER TABLE "imports" DROP COLUMN "original_url";
  ALTER TABLE "imports" DROP COLUMN "original_mime_type";
  ALTER TABLE "imports" DROP COLUMN "original_filesize";
  ALTER TABLE "imports" DROP COLUMN "original_width";
  ALTER TABLE "imports" DROP COLUMN "original_height";
  ALTER TABLE "imports" DROP COLUMN "original_prefix";
  ALTER TABLE "imports" DROP COLUMN "original__objectkey";
  ALTER TABLE "payload_jobs_log" DROP COLUMN "parent_task_slug";
  ALTER TABLE "payload_jobs_log" DROP COLUMN "parent_task_i_d";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_jobs" DROP COLUMN "processing_until";
  ALTER TABLE "payload_jobs" DROP COLUMN "processing_token";
  ALTER TABLE "payload_jobs" DROP COLUMN "concurrency_key";
  DROP TYPE "public"."enum_payload_jobs_log_parent_task_slug";
  DROP TYPE "public"."enum_payload_llm_instructions_entity_type";`)
}
