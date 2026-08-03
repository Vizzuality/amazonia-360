import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_topics_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum_topics_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum_topics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__topics_v_version_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum__topics_v_version_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum__topics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__topics_v_published_locale" AS ENUM('en', 'es', 'pt');
  CREATE TYPE "public"."enum_subtopics_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum_subtopics_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum_subtopics_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subtopics_v_version_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum__subtopics_v_version_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum__subtopics_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__subtopics_v_published_locale" AS ENUM('en', 'es', 'pt');
  CREATE TYPE "public"."enum_indicators_visualization_types" AS ENUM('map', 'table', 'chart', 'numeric');
  CREATE TYPE "public"."enum_indicators_blocks_imagery_legend_type" AS ENUM('basic');
  CREATE TYPE "public"."enum_indicators_blocks_imagery_tile_legend_type" AS ENUM('basic');
  CREATE TYPE "public"."enum_indicators_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__indicators_v_version_visualization_types" AS ENUM('map', 'table', 'chart', 'numeric');
  CREATE TYPE "public"."enum__indicators_v_blocks_imagery_legend_type" AS ENUM('basic');
  CREATE TYPE "public"."enum__indicators_v_blocks_imagery_tile_legend_type" AS ENUM('basic');
  CREATE TYPE "public"."enum__indicators_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__indicators_v_published_locale" AS ENUM('en', 'es', 'pt');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'CleanDraftReports';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'CleanDraftReports';
  CREATE TABLE "topics_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indicator_id" uuid,
  	"type" "enum_topics_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum_topics_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1
  );
  
  CREATE TABLE "topics" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"legacy_id" numeric,
  	"image" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_topics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "topics_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_topics_v_version_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"indicator_id" uuid,
  	"type" "enum__topics_v_version_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum__topics_v_version_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_topics_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_legacy_id" numeric,
  	"version_image" varchar,
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
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "subtopics_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indicator_id" uuid,
  	"type" "enum_subtopics_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum_subtopics_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1
  );
  
  CREATE TABLE "subtopics" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"legacy_id" numeric,
  	"topic_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_subtopics_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "subtopics_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_subtopics_v_version_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"indicator_id" uuid,
  	"type" "enum__subtopics_v_version_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum__subtopics_v_version_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_subtopics_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_legacy_id" numeric,
  	"version_topic_id" uuid,
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
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "indicators_visualization_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_indicators_visualization_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_feature_popup_template_field_infos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_feature_popup_template_field_infos_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"layer_id" varchar DEFAULT '0',
  	"popup_template_title" varchar,
  	"query_numeric" jsonb,
  	"query_table" jsonb,
  	"query_chart" jsonb,
  	"query_ai" jsonb,
  	"block_name" varchar
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
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"raster_function" jsonb,
  	"legend_type" "enum_indicators_blocks_imagery_legend_type" DEFAULT 'basic',
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_imagery_tile_legend_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  CREATE TABLE "indicators_blocks_imagery_tile_legend_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "indicators_blocks_imagery_tile" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"raster_function" jsonb,
  	"legend_type" "enum_indicators_blocks_imagery_tile_legend_type" DEFAULT 'basic',
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_web_tile" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_h3" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"column" varchar,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators_blocks_component" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"query_ai" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "indicators" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"legacy_id" numeric,
  	"order" numeric,
  	"subtopic_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_indicators_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "indicators_locales" (
  	"name" varchar,
  	"unit" varchar,
  	"description_short" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_indicators_v_version_visualization_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__indicators_v_version_visualization_types",
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_feature_popup_template_field_infos" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"field_name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_feature_popup_template_field_infos_locales" (
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
  	"layer_id" varchar DEFAULT '0',
  	"popup_template_title" varchar,
  	"query_numeric" jsonb,
  	"query_table" jsonb,
  	"query_chart" jsonb,
  	"query_ai" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
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
  	"raster_function" jsonb,
  	"legend_type" "enum__indicators_v_blocks_imagery_legend_type" DEFAULT 'basic',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery_tile_legend_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"color" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery_tile_legend_items_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "_indicators_v_blocks_imagery_tile" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"url" varchar,
  	"raster_function" jsonb,
  	"legend_type" "enum__indicators_v_blocks_imagery_tile_legend_type" DEFAULT 'basic',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v_blocks_web_tile" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"_path" text NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar,
  	"url" varchar,
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
  	"query_ai" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_indicators_v" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"parent_id" uuid,
  	"version_legacy_id" numeric,
  	"version_order" numeric,
  	"version_subtopic_id" uuid,
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
  	"version_unit" varchar,
  	"version_description_short" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topics_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subtopics_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "indicators_id" uuid;
  ALTER TABLE "topics_default_visualization" ADD CONSTRAINT "topics_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "topics_default_visualization" ADD CONSTRAINT "topics_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "topics_locales" ADD CONSTRAINT "topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_topics_v_version_default_visualization" ADD CONSTRAINT "_topics_v_version_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topics_v_version_default_visualization" ADD CONSTRAINT "_topics_v_version_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_topics_v" ADD CONSTRAINT "_topics_v_parent_id_topics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_topics_v_locales" ADD CONSTRAINT "_topics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_topics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subtopics_default_visualization" ADD CONSTRAINT "subtopics_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subtopics_default_visualization" ADD CONSTRAINT "subtopics_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subtopics_locales" ADD CONSTRAINT "subtopics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_visualization" ADD CONSTRAINT "_subtopics_v_version_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_visualization" ADD CONSTRAINT "_subtopics_v_version_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subtopics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subtopics_v" ADD CONSTRAINT "_subtopics_v_parent_id_subtopics_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v" ADD CONSTRAINT "_subtopics_v_version_topic_id_topics_id_fk" FOREIGN KEY ("version_topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v_locales" ADD CONSTRAINT "_subtopics_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subtopics_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_visualization_types" ADD CONSTRAINT "indicators_visualization_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature_popup_template_field_infos" ADD CONSTRAINT "indicators_blocks_feature_popup_template_field_infos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature_popup_template_field_infos_locales" ADD CONSTRAINT "indicators_blocks_feature_popup_template_field_infos_loca_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_feature_popup_template_field_infos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_feature" ADD CONSTRAINT "indicators_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_legend_items" ADD CONSTRAINT "indicators_blocks_imagery_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_legend_items_locales" ADD CONSTRAINT "indicators_blocks_imagery_legend_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery" ADD CONSTRAINT "indicators_blocks_imagery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_tile_legend_items" ADD CONSTRAINT "indicators_blocks_imagery_tile_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery_tile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_tile_legend_items_locales" ADD CONSTRAINT "indicators_blocks_imagery_tile_legend_items_locales_paren_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators_blocks_imagery_tile_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_imagery_tile" ADD CONSTRAINT "indicators_blocks_imagery_tile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_web_tile" ADD CONSTRAINT "indicators_blocks_web_tile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_h3" ADD CONSTRAINT "indicators_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_blocks_component" ADD CONSTRAINT "indicators_blocks_component_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators" ADD CONSTRAINT "indicators_subtopic_id_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "indicators_locales" ADD CONSTRAINT "indicators_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_version_visualization_types" ADD CONSTRAINT "_indicators_v_version_visualization_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature_popup_template_field_infos" ADD CONSTRAINT "_indicators_v_blocks_feature_popup_template_field_infos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_feature"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature_popup_template_field_infos_locales" ADD CONSTRAINT "_indicators_v_blocks_feature_popup_template_field_infos_l_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_feature_popup_template_field_infos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_feature" ADD CONSTRAINT "_indicators_v_blocks_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items" ADD CONSTRAINT "_indicators_v_blocks_imagery_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items_locales" ADD CONSTRAINT "_indicators_v_blocks_imagery_legend_items_locales_parent__fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery" ADD CONSTRAINT "_indicators_v_blocks_imagery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_tile_legend_items" ADD CONSTRAINT "_indicators_v_blocks_imagery_tile_legend_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery_tile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_tile_legend_items_locales" ADD CONSTRAINT "_indicators_v_blocks_imagery_tile_legend_items_locales_pa_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v_blocks_imagery_tile_legend_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_imagery_tile" ADD CONSTRAINT "_indicators_v_blocks_imagery_tile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_web_tile" ADD CONSTRAINT "_indicators_v_blocks_web_tile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_h3" ADD CONSTRAINT "_indicators_v_blocks_h3_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_blocks_component" ADD CONSTRAINT "_indicators_v_blocks_component_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_parent_id_indicators_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_version_subtopic_id_subtopics_id_fk" FOREIGN KEY ("version_subtopic_id") REFERENCES "public"."subtopics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v_locales" ADD CONSTRAINT "_indicators_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "topics_default_visualization_order_idx" ON "topics_default_visualization" USING btree ("_order");
  CREATE INDEX "topics_default_visualization_parent_id_idx" ON "topics_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "topics_default_visualization_indicator_idx" ON "topics_default_visualization" USING btree ("indicator_id");
  CREATE UNIQUE INDEX "topics_legacy_id_idx" ON "topics" USING btree ("legacy_id");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "topics__status_idx" ON "topics" USING btree ("_status");
  CREATE UNIQUE INDEX "topics_locales_locale_parent_id_unique" ON "topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_topics_v_version_default_visualization_order_idx" ON "_topics_v_version_default_visualization" USING btree ("_order");
  CREATE INDEX "_topics_v_version_default_visualization_parent_id_idx" ON "_topics_v_version_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "_topics_v_version_default_visualization_indicator_idx" ON "_topics_v_version_default_visualization" USING btree ("indicator_id");
  CREATE INDEX "_topics_v_parent_idx" ON "_topics_v" USING btree ("parent_id");
  CREATE INDEX "_topics_v_version_version_legacy_id_idx" ON "_topics_v" USING btree ("version_legacy_id");
  CREATE INDEX "_topics_v_version_version_updated_at_idx" ON "_topics_v" USING btree ("version_updated_at");
  CREATE INDEX "_topics_v_version_version_created_at_idx" ON "_topics_v" USING btree ("version_created_at");
  CREATE INDEX "_topics_v_version_version__status_idx" ON "_topics_v" USING btree ("version__status");
  CREATE INDEX "_topics_v_created_at_idx" ON "_topics_v" USING btree ("created_at");
  CREATE INDEX "_topics_v_updated_at_idx" ON "_topics_v" USING btree ("updated_at");
  CREATE INDEX "_topics_v_snapshot_idx" ON "_topics_v" USING btree ("snapshot");
  CREATE INDEX "_topics_v_published_locale_idx" ON "_topics_v" USING btree ("published_locale");
  CREATE INDEX "_topics_v_latest_idx" ON "_topics_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_topics_v_locales_locale_parent_id_unique" ON "_topics_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subtopics_default_visualization_order_idx" ON "subtopics_default_visualization" USING btree ("_order");
  CREATE INDEX "subtopics_default_visualization_parent_id_idx" ON "subtopics_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "subtopics_default_visualization_indicator_idx" ON "subtopics_default_visualization" USING btree ("indicator_id");
  CREATE UNIQUE INDEX "subtopics_legacy_id_idx" ON "subtopics" USING btree ("legacy_id");
  CREATE INDEX "subtopics_topic_idx" ON "subtopics" USING btree ("topic_id");
  CREATE INDEX "subtopics_updated_at_idx" ON "subtopics" USING btree ("updated_at");
  CREATE INDEX "subtopics_created_at_idx" ON "subtopics" USING btree ("created_at");
  CREATE INDEX "subtopics__status_idx" ON "subtopics" USING btree ("_status");
  CREATE UNIQUE INDEX "subtopics_locales_locale_parent_id_unique" ON "subtopics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_subtopics_v_version_default_visualization_order_idx" ON "_subtopics_v_version_default_visualization" USING btree ("_order");
  CREATE INDEX "_subtopics_v_version_default_visualization_parent_id_idx" ON "_subtopics_v_version_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "_subtopics_v_version_default_visualization_indicator_idx" ON "_subtopics_v_version_default_visualization" USING btree ("indicator_id");
  CREATE INDEX "_subtopics_v_parent_idx" ON "_subtopics_v" USING btree ("parent_id");
  CREATE INDEX "_subtopics_v_version_version_legacy_id_idx" ON "_subtopics_v" USING btree ("version_legacy_id");
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
  CREATE INDEX "indicators_blocks_feature_popup_template_field_infos_order_idx" ON "indicators_blocks_feature_popup_template_field_infos" USING btree ("_order");
  CREATE INDEX "indicators_blocks_feature_popup_template_field_infos_parent_id_idx" ON "indicators_blocks_feature_popup_template_field_infos" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_feature_popup_template_field_infos_local_1" ON "indicators_blocks_feature_popup_template_field_infos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_feature_order_idx" ON "indicators_blocks_feature" USING btree ("_order");
  CREATE INDEX "indicators_blocks_feature_parent_id_idx" ON "indicators_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_feature_path_idx" ON "indicators_blocks_feature" USING btree ("_path");
  CREATE INDEX "indicators_blocks_imagery_legend_items_order_idx" ON "indicators_blocks_imagery_legend_items" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_legend_items_parent_id_idx" ON "indicators_blocks_imagery_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_legend_items_locales_locale_parent" ON "indicators_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_imagery_order_idx" ON "indicators_blocks_imagery" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_parent_id_idx" ON "indicators_blocks_imagery" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_imagery_path_idx" ON "indicators_blocks_imagery" USING btree ("_path");
  CREATE INDEX "indicators_blocks_imagery_tile_legend_items_order_idx" ON "indicators_blocks_imagery_tile_legend_items" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_tile_legend_items_parent_id_idx" ON "indicators_blocks_imagery_tile_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "indicators_blocks_imagery_tile_legend_items_locales_locale_p" ON "indicators_blocks_imagery_tile_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "indicators_blocks_imagery_tile_order_idx" ON "indicators_blocks_imagery_tile" USING btree ("_order");
  CREATE INDEX "indicators_blocks_imagery_tile_parent_id_idx" ON "indicators_blocks_imagery_tile" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_imagery_tile_path_idx" ON "indicators_blocks_imagery_tile" USING btree ("_path");
  CREATE INDEX "indicators_blocks_web_tile_order_idx" ON "indicators_blocks_web_tile" USING btree ("_order");
  CREATE INDEX "indicators_blocks_web_tile_parent_id_idx" ON "indicators_blocks_web_tile" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_web_tile_path_idx" ON "indicators_blocks_web_tile" USING btree ("_path");
  CREATE INDEX "indicators_blocks_h3_order_idx" ON "indicators_blocks_h3" USING btree ("_order");
  CREATE INDEX "indicators_blocks_h3_parent_id_idx" ON "indicators_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_h3_path_idx" ON "indicators_blocks_h3" USING btree ("_path");
  CREATE INDEX "indicators_blocks_component_order_idx" ON "indicators_blocks_component" USING btree ("_order");
  CREATE INDEX "indicators_blocks_component_parent_id_idx" ON "indicators_blocks_component" USING btree ("_parent_id");
  CREATE INDEX "indicators_blocks_component_path_idx" ON "indicators_blocks_component" USING btree ("_path");
  CREATE UNIQUE INDEX "indicators_legacy_id_idx" ON "indicators" USING btree ("legacy_id");
  CREATE INDEX "indicators_subtopic_idx" ON "indicators" USING btree ("subtopic_id");
  CREATE INDEX "indicators_updated_at_idx" ON "indicators" USING btree ("updated_at");
  CREATE INDEX "indicators_created_at_idx" ON "indicators" USING btree ("created_at");
  CREATE INDEX "indicators__status_idx" ON "indicators" USING btree ("_status");
  CREATE UNIQUE INDEX "indicators_locales_locale_parent_id_unique" ON "indicators_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_version_visualization_types_order_idx" ON "_indicators_v_version_visualization_types" USING btree ("order");
  CREATE INDEX "_indicators_v_version_visualization_types_parent_idx" ON "_indicators_v_version_visualization_types" USING btree ("parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_popup_template_field_infos_order_idx" ON "_indicators_v_blocks_feature_popup_template_field_infos" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_feature_popup_template_field_infos_parent_id_idx" ON "_indicators_v_blocks_feature_popup_template_field_infos" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_feature_popup_template_field_infos_loca" ON "_indicators_v_blocks_feature_popup_template_field_infos_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_order_idx" ON "_indicators_v_blocks_feature" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_feature_parent_id_idx" ON "_indicators_v_blocks_feature" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_feature_path_idx" ON "_indicators_v_blocks_feature" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_imagery_legend_items_order_idx" ON "_indicators_v_blocks_imagery_legend_items" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_legend_items_parent_id_idx" ON "_indicators_v_blocks_imagery_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_legend_items_locales_locale_par" ON "_indicators_v_blocks_imagery_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_order_idx" ON "_indicators_v_blocks_imagery" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_parent_id_idx" ON "_indicators_v_blocks_imagery" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_path_idx" ON "_indicators_v_blocks_imagery" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_imagery_tile_legend_items_order_idx" ON "_indicators_v_blocks_imagery_tile_legend_items" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_tile_legend_items_parent_id_idx" ON "_indicators_v_blocks_imagery_tile_legend_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_indicators_v_blocks_imagery_tile_legend_items_locales_local" ON "_indicators_v_blocks_imagery_tile_legend_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_tile_order_idx" ON "_indicators_v_blocks_imagery_tile" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_imagery_tile_parent_id_idx" ON "_indicators_v_blocks_imagery_tile" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_imagery_tile_path_idx" ON "_indicators_v_blocks_imagery_tile" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_web_tile_order_idx" ON "_indicators_v_blocks_web_tile" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_web_tile_parent_id_idx" ON "_indicators_v_blocks_web_tile" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_web_tile_path_idx" ON "_indicators_v_blocks_web_tile" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_h3_order_idx" ON "_indicators_v_blocks_h3" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_h3_parent_id_idx" ON "_indicators_v_blocks_h3" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_h3_path_idx" ON "_indicators_v_blocks_h3" USING btree ("_path");
  CREATE INDEX "_indicators_v_blocks_component_order_idx" ON "_indicators_v_blocks_component" USING btree ("_order");
  CREATE INDEX "_indicators_v_blocks_component_parent_id_idx" ON "_indicators_v_blocks_component" USING btree ("_parent_id");
  CREATE INDEX "_indicators_v_blocks_component_path_idx" ON "_indicators_v_blocks_component" USING btree ("_path");
  CREATE INDEX "_indicators_v_parent_idx" ON "_indicators_v" USING btree ("parent_id");
  CREATE INDEX "_indicators_v_version_version_legacy_id_idx" ON "_indicators_v" USING btree ("version_legacy_id");
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
   ALTER TABLE "topics_default_visualization" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v_version_default_visualization" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_topics_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics_default_visualization" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subtopics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v_version_default_visualization" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_subtopics_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_visualization_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature_popup_template_field_infos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature_popup_template_field_infos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_feature" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_tile_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_tile_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_imagery_tile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_web_tile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_blocks_component" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_version_visualization_types" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature_popup_template_field_infos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature_popup_template_field_infos_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_feature" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_tile_legend_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_tile_legend_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_imagery_tile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_web_tile" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_h3" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_blocks_component" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topics_default_visualization" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "topics_locales" CASCADE;
  DROP TABLE "_topics_v_version_default_visualization" CASCADE;
  DROP TABLE "_topics_v" CASCADE;
  DROP TABLE "_topics_v_locales" CASCADE;
  DROP TABLE "subtopics_default_visualization" CASCADE;
  DROP TABLE "subtopics" CASCADE;
  DROP TABLE "subtopics_locales" CASCADE;
  DROP TABLE "_subtopics_v_version_default_visualization" CASCADE;
  DROP TABLE "_subtopics_v" CASCADE;
  DROP TABLE "_subtopics_v_locales" CASCADE;
  DROP TABLE "indicators_visualization_types" CASCADE;
  DROP TABLE "indicators_blocks_feature_popup_template_field_infos" CASCADE;
  DROP TABLE "indicators_blocks_feature_popup_template_field_infos_locales" CASCADE;
  DROP TABLE "indicators_blocks_feature" CASCADE;
  DROP TABLE "indicators_blocks_imagery_legend_items" CASCADE;
  DROP TABLE "indicators_blocks_imagery_legend_items_locales" CASCADE;
  DROP TABLE "indicators_blocks_imagery" CASCADE;
  DROP TABLE "indicators_blocks_imagery_tile_legend_items" CASCADE;
  DROP TABLE "indicators_blocks_imagery_tile_legend_items_locales" CASCADE;
  DROP TABLE "indicators_blocks_imagery_tile" CASCADE;
  DROP TABLE "indicators_blocks_web_tile" CASCADE;
  DROP TABLE "indicators_blocks_h3" CASCADE;
  DROP TABLE "indicators_blocks_component" CASCADE;
  DROP TABLE "indicators" CASCADE;
  DROP TABLE "indicators_locales" CASCADE;
  DROP TABLE "_indicators_v_version_visualization_types" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature_popup_template_field_infos" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature_popup_template_field_infos_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_feature" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_legend_items" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_legend_items_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_tile_legend_items" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_tile_legend_items_locales" CASCADE;
  DROP TABLE "_indicators_v_blocks_imagery_tile" CASCADE;
  DROP TABLE "_indicators_v_blocks_web_tile" CASCADE;
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
  DROP TYPE "public"."enum_topics_default_visualization_type";
  DROP TYPE "public"."enum_topics_default_visualization_basemap_id";
  DROP TYPE "public"."enum_topics_status";
  DROP TYPE "public"."enum__topics_v_version_default_visualization_type";
  DROP TYPE "public"."enum__topics_v_version_default_visualization_basemap_id";
  DROP TYPE "public"."enum__topics_v_version_status";
  DROP TYPE "public"."enum__topics_v_published_locale";
  DROP TYPE "public"."enum_subtopics_default_visualization_type";
  DROP TYPE "public"."enum_subtopics_default_visualization_basemap_id";
  DROP TYPE "public"."enum_subtopics_status";
  DROP TYPE "public"."enum__subtopics_v_version_default_visualization_type";
  DROP TYPE "public"."enum__subtopics_v_version_default_visualization_basemap_id";
  DROP TYPE "public"."enum__subtopics_v_version_status";
  DROP TYPE "public"."enum__subtopics_v_published_locale";
  DROP TYPE "public"."enum_indicators_visualization_types";
  DROP TYPE "public"."enum_indicators_blocks_imagery_legend_type";
  DROP TYPE "public"."enum_indicators_blocks_imagery_tile_legend_type";
  DROP TYPE "public"."enum_indicators_status";
  DROP TYPE "public"."enum__indicators_v_version_visualization_types";
  DROP TYPE "public"."enum__indicators_v_blocks_imagery_legend_type";
  DROP TYPE "public"."enum__indicators_v_blocks_imagery_tile_legend_type";
  DROP TYPE "public"."enum__indicators_v_version_status";
  DROP TYPE "public"."enum__indicators_v_published_locale";`)
}
