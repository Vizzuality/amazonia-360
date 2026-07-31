import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_topics_default_layout_type" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__topics_v_version_default_layout_type" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum__topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__topics_v_published_locale" AS ENUM('en', 'es', 'pt');
  CREATE TYPE "public"."enum_subtopics_default_layout_type" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum_subtopics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subtopics_v_version_default_layout_type" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum__subtopics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subtopics_v_published_locale" AS ENUM('en', 'es', 'pt');
  CREATE TYPE "public"."enum_indicators_visualization_types" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum_indicators_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__indicators_v_version_visualization_types" AS ENUM('map', 'table', 'chart', 'numeric', 'ai', 'custom');
  CREATE TYPE "public"."enum__indicators_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__indicators_v_published_locale" AS ENUM('en', 'es', 'pt');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'CleanDraftReports';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'CleanDraftReports';
  CREATE TABLE "topics_default_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indicator_id" numeric,
  	"type" "enum_topics_default_layout_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric
  );
  
  CREATE TABLE "topics" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_topics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "topics_locales" (
  	"name" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" numeric NOT NULL
  );
  
  CREATE TABLE "_topics_v_version_default_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"indicator_id" numeric,
  	"type" "enum__topics_v_version_default_layout_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_topics_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__topics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__topics_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_topics_v_locales" (
  	"version_name" varchar,
  	"version_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "subtopics_default_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indicator_id" numeric,
  	"type" "enum_subtopics_default_layout_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric
  );
  
  CREATE TABLE "subtopics" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"topic_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_subtopics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "subtopics_locales" (
  	"name" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" numeric NOT NULL
  );
  
  CREATE TABLE "_subtopics_v_version_default_layout" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"indicator_id" numeric,
  	"type" "enum__subtopics_v_version_default_layout_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_subtopics_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" numeric,
  	"version_topic_id" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__subtopics_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__subtopics_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_subtopics_v_locales" (
  	"version_name" varchar,
  	"version_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "indicators_visualization_types" (
  	"order" integer NOT NULL,
  	"parent_id" numeric NOT NULL,
  	"value" "enum_indicators_visualization_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_feature_popup_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_feature_popup_fields_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"layer_id" varchar,
  	"queries_table" jsonb,
  	"queries_chart" jsonb,
  	"queries_numeric" jsonb,
  	"queries_ai" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_feature_locales" (
  	"popup_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_imagery_legend_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  CREATE TABLE "indicators_blocks_imagery_legend_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_imagery" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"raster_function" varchar,
  	"legend_type" varchar DEFAULT 'basic',
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_h3" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"column" varchar,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_component" (
  	"_order" integer NOT NULL,
  	"_parent_id" numeric NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators" (
  	"id" numeric PRIMARY KEY NOT NULL,
  	"subtopic_id" numeric,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_indicators_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "indicators_locales" (
  	"name" varchar,
  	"description" jsonb,
  	"description_short" varchar,
  	"unit" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" numeric NOT NULL
  );
  
  CREATE TABLE "_indicators_v_version_visualization_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__indicators_v_version_visualization_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_feature_popup_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"field_name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_feature_popup_fields_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"layer_id" varchar,
  	"queries_table" jsonb,
  	"queries_chart" jsonb,
  	"queries_numeric" jsonb,
  	"queries_ai" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_feature_locales" (
  	"popup_title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery_legend_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"color" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery_legend_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"raster_function" varchar,
  	"legend_type" varchar DEFAULT 'basic',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_h3" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"column" varchar,
  	"url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_component" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" numeric,
  	"version_subtopic_id" numeric,
  	"version_order" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__indicators_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__indicators_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_indicators_v_locales" (
  	"version_name" varchar,
  	"version_description" jsonb,
  	"version_description_short" varchar,
  	"version_unit" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topics_id" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subtopics_id" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "indicators_id" numeric;
  ALTER TABLE "topics_default_layout" ADD CONSTRAINT "topics_default_layout_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "topics_default_layout" ADD CONSTRAINT "topics_default_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "topics_locales" ADD CONSTRAINT "topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_topics_v_version_default_layout" ADD CONSTRAINT "_topics_v_version_default_layout_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topics_v_version_default_layout" ADD CONSTRAINT "_topics_v_version_default_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_topics_v" ADD CONSTRAINT "_topics_v_parent_id_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topics_v_locales" ADD CONSTRAINT "_topics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subtopics_default_layout" ADD CONSTRAINT "subtopics_default_layout_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subtopics_default_layout" ADD CONSTRAINT "subtopics_default_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subtopics_locales" ADD CONSTRAINT "subtopics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_layout" ADD CONSTRAINT "_subtopics_v_version_default_layout_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_layout" ADD CONSTRAINT "_subtopics_v_version_default_layout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subtopics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subtopics_v" ADD CONSTRAINT "_subtopics_v_parent_id_subtopics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v" ADD CONSTRAINT "_subtopics_v_version_topic_id_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v_locales" ADD CONSTRAINT "_subtopics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subtopics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_visualization_types" ADD CONSTRAINT "indicators_visualization_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature_popup_fields" ADD CONSTRAINT "indicators_blocks_feature_popup_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature_popup_fields_locales" ADD CONSTRAINT "indicators_blocks_feature_popup_fields_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_feature_popup_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature" ADD CONSTRAINT "indicators_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature_locales" ADD CONSTRAINT "indicators_blocks_feature_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_legend_items" ADD CONSTRAINT "indicators_blocks_imagery_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_legend_items_locales" ADD CONSTRAINT "indicators_blocks_imagery_legend_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery" ADD CONSTRAINT "indicators_blocks_imagery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_h3" ADD CONSTRAINT "indicators_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_component" ADD CONSTRAINT "indicators_blocks_component_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators" ADD CONSTRAINT "indicators_subtopic_id_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "indicators_locales" ADD CONSTRAINT "indicators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_version_visualization_types" ADD CONSTRAINT "_indicators_v_version_visualization_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature_popup_fields" ADD CONSTRAINT "_indicators_v_blocks_feature_popup_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature_popup_fields_locales" ADD CONSTRAINT "_indicators_v_blocks_feature_popup_fields_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_feature_popup_fields"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature" ADD CONSTRAINT "_indicators_v_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature_locales" ADD CONSTRAINT "_indicators_v_blocks_feature_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items" ADD CONSTRAINT "_indicators_v_blocks_imagery_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items_locales" ADD CONSTRAINT "_indicators_v_blocks_imagery_legend_items_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery" ADD CONSTRAINT "_indicators_v_blocks_imagery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_h3" ADD CONSTRAINT "_indicators_v_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_component" ADD CONSTRAINT "_indicators_v_blocks_component_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_parent_id_indicators_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_version_subtopic_id_subtopics_id_fk" FOREIGN KEY ("version_subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v_locales" ADD CONSTRAINT "_indicators_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "topics_default_layout_order_idx" ON "topics_default_layout" USING btree ("_order");
  CREATE INDEX "topics_default_layout_parent_id_idx" ON "topics_default_layout" USING btree ("_parent_id");
  CREATE INDEX "topics_default_layout_indicator_idx" ON "topics_default_layout" USING btree ("indicator_id");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "topics__status_idx" ON "topics" USING btree ("_status");
  CREATE UNIQUE INDEX "topics_locales_locale_parent_id_unique" ON "topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_topics_v_version_default_layout_order_idx" ON "_topics_v_version_default_layout" USING btree ("_order");
  CREATE INDEX "_topics_v_version_default_layout_parent_id_idx" ON "_topics_v_version_default_layout" USING btree ("_parent_id");
  CREATE INDEX "_topics_v_version_default_layout_indicator_idx" ON "_topics_v_version_default_layout" USING btree ("indicator_id");
  CREATE INDEX "_topics_v_parent_idx" ON "_topics_v" USING btree ("parent_id");
  CREATE INDEX "_topics_v_version_version_updated_at_idx" ON "_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_topics_v_version_version_created_at_idx" ON "_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_topics_v_version_version__status_idx" ON "_topics_v" USING btree ("version__status");
  CREATE INDEX "_topics_v_created_at_idx" ON "_topics_v" USING btree ("created_at");
  CREATE INDEX "_topics_v_updated_at_idx" ON "_topics_v" USING btree ("updated_at");
  CREATE INDEX "_topics_v_snapshot_idx" ON "_topics_v" USING btree ("snapshot");
  CREATE INDEX "_topics_v_published_locale_idx" ON "_topics_v" USING btree ("published_locale");
  CREATE INDEX "_topics_v_latest_idx" ON "_topics_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_topics_v_locales_locale_parent_id_unique" ON "_topics_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subtopics_default_layout_order_idx" ON "subtopics_default_layout" USING btree ("_order");
  CREATE INDEX "subtopics_default_layout_parent_id_idx" ON "subtopics_default_layout" USING btree ("_parent_id");
  CREATE INDEX "subtopics_default_layout_indicator_idx" ON "subtopics_default_layout" USING btree ("indicator_id");
  CREATE INDEX "subtopics_topic_idx" ON "subtopics" USING btree ("topic_id");
  CREATE INDEX "subtopics_updated_at_idx" ON "subtopics" USING btree ("updated_at");
  CREATE INDEX "subtopics_created_at_idx" ON "subtopics" USING btree ("created_at");
  CREATE INDEX "subtopics__status_idx" ON "subtopics" USING btree ("_status");
  CREATE UNIQUE INDEX "subtopics_locales_locale_parent_id_unique" ON "subtopics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_subtopics_v_version_default_layout_order_idx" ON "_subtopics_v_version_default_layout" USING btree ("_order");
  CREATE INDEX "_subtopics_v_version_default_layout_parent_id_idx" ON "_subtopics_v_version_default_layout" USING btree ("_parent_id");
  CREATE INDEX "_subtopics_v_version_default_layout_indicator_idx" ON "_subtopics_v_version_default_layout" USING btree ("indicator_id");
  CREATE INDEX "_subtopics_v_parent_idx" ON "_subtopics_v" USING btree ("parent_id");
  CREATE INDEX "_subtopics_v_version_version_topic_idx" ON "_subtopics_v" USING btree ("version_topic_id");
  CREATE INDEX "_subtopics_v_version_version_updated_at_idx" ON "_subtopics_v" USING btree ("version_updated_at");
  CREATE INDEX "_subtopics_v_version_version_created_at_idx" ON "_subtopics_v" USING btree ("version_created_at");
  CREATE INDEX "_subtopics_v_version_version__status_idx" ON "_subtopics_v" USING btree ("version__status");
  CREATE INDEX "_subtopics_v_created_at_idx" ON "_subtopics_v" USING btree ("created_at");
  CREATE INDEX "_subtopics_v_updated_at_idx" ON "_subtopics_v" USING btree ("updated_at");
  CREATE INDEX "_subtopics_v_snapshot_idx" ON "_subtopics_v" USING btree ("snapshot");
  CREATE INDEX "_subtopics_v_published_locale_idx" ON "_subtopics_v" USING btree ("published_locale");
  CREATE INDEX "_subtopics_v_latest_idx" ON "_subtopics_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_subtopics_v_locales_locale_parent_id_unique" ON "_subtopics_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_visualization_types_order_idx" ON "indicators_visualization_types" USING btree ("order");
  CREATE INDEX "indicators_visualization_types_parent_idx" ON "indicators_visualization_types" USING btree ("parent_id");
  CREATE INDEX "indicators_blocks_feature_popup_fields_order_idx" ON "indicators_blocks_feature_popup_fields" USING btree ("_order");
  CREATE INDEX "indicators_blocks_feature_popup_fields_parent_id_idx" ON "indicators_blocks_feature_popup_fields" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_feature_popup_fields_locales_locale_parent" ON "indicators_blocks_feature_popup_fields_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_feature_order_idx" ON "indicators_blocks_feature" USING btree ("_order");
  CREATE INDEX "indicators_blocks_feature_parent_id_idx" ON "indicators_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_feature_path_idx" ON "indicators_blocks_feature" USING btree ("_path");
  CREATE UNIQUE INDEX "indicators_blocks_feature_locales_locale_parent_id_unique" ON "indicators_blocks_feature_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_imagery_legend_items_order_idx" ON "indicators_blocks_imagery_legend_items" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_legend_items_parent_id_idx" ON "indicators_blocks_imagery_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_legend_items_locales_locale_parent" ON "indicators_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_imagery_order_idx" ON "indicators_blocks_imagery" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_parent_id_idx" ON "indicators_blocks_imagery" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_imagery_path_idx" ON "indicators_blocks_imagery" USING btree ("_path");
  CREATE INDEX "indicators_blocks_h3_order_idx" ON "indicators_blocks_h3" USING btree ("_order");
  CREATE INDEX "indicators_blocks_h3_parent_id_idx" ON "indicators_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_h3_path_idx" ON "indicators_blocks_h3" USING btree ("_path");
  CREATE INDEX "indicators_blocks_component_order_idx" ON "indicators_blocks_component" USING btree ("_order");
  CREATE INDEX "indicators_blocks_component_parent_id_idx" ON "indicators_blocks_component" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_component_path_idx" ON "indicators_blocks_component" USING btree ("_path");
  CREATE INDEX "indicators_subtopic_idx" ON "indicators" USING btree ("subtopic_id");
  CREATE INDEX "indicators_updated_at_idx" ON "indicators" USING btree ("updated_at");
  CREATE INDEX "indicators_created_at_idx" ON "indicators" USING btree ("created_at");
  CREATE INDEX "indicators__status_idx" ON "indicators" USING btree ("_status");
  CREATE UNIQUE INDEX "indicators_locales_locale_parent_id_unique" ON "indicators_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_version_visualization_types_order_idx" ON "_indicators_v_version_visualization_types" USING btree ("order");
  CREATE INDEX "_indicators_v_version_visualization_types_parent_idx" ON "_indicators_v_version_visualization_types" USING btree ("parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_popup_fields_order_idx" ON "_indicators_v_blocks_feature_popup_fields" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_feature_popup_fields_parent_id_idx" ON "_indicators_v_blocks_feature_popup_fields" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_feature_popup_fields_locales_locale_par" ON "_indicators_v_blocks_feature_popup_fields_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_order_idx" ON "_indicators_v_blocks_feature" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_feature_parent_id_idx" ON "_indicators_v_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_path_idx" ON "_indicators_v_blocks_feature" USING btree ("_path");
  CREATE UNIQUE INDEX "_indicators_v_blocks_feature_locales_locale_parent_id_unique" ON "_indicators_v_blocks_feature_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_legend_items_order_idx" ON "_indicators_v_blocks_imagery_legend_items" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_legend_items_parent_id_idx" ON "_indicators_v_blocks_imagery_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_legend_items_locales_locale_par" ON "_indicators_v_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_order_idx" ON "_indicators_v_blocks_imagery" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_parent_id_idx" ON "_indicators_v_blocks_imagery" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_path_idx" ON "_indicators_v_blocks_imagery" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_h3_order_idx" ON "_indicators_v_blocks_h3" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_h3_parent_id_idx" ON "_indicators_v_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_h3_path_idx" ON "_indicators_v_blocks_h3" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_component_order_idx" ON "_indicators_v_blocks_component" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_component_parent_id_idx" ON "_indicators_v_blocks_component" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_component_path_idx" ON "_indicators_v_blocks_component" USING btree ("_path");
  CREATE INDEX "_indicators_v_parent_idx" ON "_indicators_v" USING btree ("parent_id");
  CREATE INDEX "_indicators_v_version_version_subtopic_idx" ON "_indicators_v" USING btree ("version_subtopic_id");
  CREATE INDEX "_indicators_v_version_version_updated_at_idx" ON "_indicators_v" USING btree ("version_updated_at");
  CREATE INDEX "_indicators_v_version_version_created_at_idx" ON "_indicators_v" USING btree ("version_created_at");
  CREATE INDEX "_indicators_v_version_version__status_idx" ON "_indicators_v" USING btree ("version__status");
  CREATE INDEX "_indicators_v_created_at_idx" ON "_indicators_v" USING btree ("created_at");
  CREATE INDEX "_indicators_v_updated_at_idx" ON "_indicators_v" USING btree ("updated_at");
  CREATE INDEX "_indicators_v_snapshot_idx" ON "_indicators_v" USING btree ("snapshot");
  CREATE INDEX "_indicators_v_published_locale_idx" ON "_indicators_v" USING btree ("published_locale");
  CREATE INDEX "_indicators_v_latest_idx" ON "_indicators_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_indicators_v_locales_locale_parent_id_unique" ON "_indicators_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subtopics_fk" FOREIGN KEY ("subtopics_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_indicators_fk" FOREIGN KEY ("indicators_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_subtopics_id_idx" ON "payload_locked_documents_rels" USING btree ("subtopics_id");
  CREATE INDEX "payload_locked_documents_rels_indicators_id_idx" ON "payload_locked_documents_rels" USING btree ("indicators_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics_default_layout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v_version_default_layout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics_default_layout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v_version_default_layout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_visualization_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature_popup_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature_popup_fields_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_component" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_version_visualization_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature_popup_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature_popup_fields_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_component" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topics_default_layout" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "topics_locales" CASCADE;
  DROP TABLE "_topics_v_version_default_layout" CASCADE;
  DROP TABLE "_topics_v" CASCADE;
  DROP TABLE "_topics_v_locales" CASCADE;
  DROP TABLE "subtopics_default_layout" CASCADE;
  DROP TABLE "subtopics" CASCADE;
  DROP TABLE "subtopics_locales" CASCADE;
  DROP TABLE "_subtopics_v_version_default_layout" CASCADE;
  DROP TABLE "_subtopics_v" CASCADE;
  DROP TABLE "_subtopics_v_locales" CASCADE;
  DROP TABLE "indicators_visualization_types" CASCADE;
  DROP TABLE "indicators_blocks_feature_popup_fields" CASCADE;
  DROP TABLE "indicators_blocks_feature_popup_fields_locales" CASCADE;
  DROP TABLE "indicators_blocks_feature" CASCADE;
  DROP TABLE "indicators_blocks_feature_locales" CASCADE;
  DROP TABLE "indicators_blocks_imagery_legend_items" CASCADE;
  DROP TABLE "indicators_blocks_imagery_legend_items_locales" CASCADE;
  DROP TABLE "indicators_blocks_imagery" CASCADE;
  DROP TABLE "indicators_blocks_h3" CASCADE;
  DROP TABLE "indicators_blocks_component" CASCADE;
  DROP TABLE "indicators" CASCADE;
  DROP TABLE "indicators_locales" CASCADE;
  DROP TABLE "_indicators_v_version_visualization_types" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature_popup_fields" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature_popup_fields_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_legend_items" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_legend_items_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery" CASCADE;
  DROP TABLE "_indicators_v_blocks_h3" CASCADE;
  DROP TABLE "_indicators_v_blocks_component" CASCADE;
  DROP TABLE "_indicators_v" CASCADE;
  DROP TABLE "_indicators_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_topics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subtopics_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_indicators_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'CleanAnonymousUsers');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'CleanAnonymousUsers');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_topics_id_idx";
  DROP INDEX "payload_locked_documents_rels_subtopics_id_idx";
  DROP INDEX "payload_locked_documents_rels_indicators_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "topics_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subtopics_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "indicators_id";
  DROP TYPE "public"."enum_topics_default_layout_type";
  DROP TYPE "public"."enum_topics_status";
  DROP TYPE "public"."enum__topics_v_version_default_layout_type";
  DROP TYPE "public"."enum__topics_v_version_status";
  DROP TYPE "public"."enum__topics_v_published_locale";
  DROP TYPE "public"."enum_subtopics_default_layout_type";
  DROP TYPE "public"."enum_subtopics_status";
  DROP TYPE "public"."enum__subtopics_v_version_default_layout_type";
  DROP TYPE "public"."enum__subtopics_v_version_status";
  DROP TYPE "public"."enum__subtopics_v_published_locale";
  DROP TYPE "public"."enum_indicators_visualization_types";
  DROP TYPE "public"."enum_indicators_status";
  DROP TYPE "public"."enum__indicators_v_version_visualization_types";
  DROP TYPE "public"."enum__indicators_v_version_status";
  DROP TYPE "public"."enum__indicators_v_published_locale";`)
}
