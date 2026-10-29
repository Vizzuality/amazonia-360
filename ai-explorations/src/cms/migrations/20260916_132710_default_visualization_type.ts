import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_indicators_default_visualization_type" AS ENUM('map', 'table', 'chart', 'numeric');
  CREATE TYPE "public"."enum__indicators_v_version_default_visualization_type" AS ENUM('map', 'table', 'chart', 'numeric');
  DROP TABLE "subtopics_default_visualization" CASCADE;
  DROP TABLE "_subtopics_v_version_default_visualization" CASCADE;
  ALTER TABLE "indicators" ADD COLUMN "default_visualization_type" "enum_indicators_default_visualization_type";
  ALTER TABLE "_indicators_v" ADD COLUMN "version_default_visualization_type" "enum__indicators_v_version_default_visualization_type";
  DROP TYPE "public"."enum_subtopics_default_visualization_type";
  DROP TYPE "public"."enum_subtopics_default_visualization_basemap_id";
  DROP TYPE "public"."enum__subtopics_v_version_default_visualization_type";
  DROP TYPE "public"."enum__subtopics_v_version_default_visualization_basemap_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_subtopics_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum_subtopics_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum__subtopics_v_version_default_visualization_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum__subtopics_v_version_default_visualization_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TABLE "subtopics_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"indicator_id" varchar,
  	"type" "enum_subtopics_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum_subtopics_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1
  );
  
  CREATE TABLE "_subtopics_v_version_default_visualization" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"indicator_id" varchar,
  	"type" "enum__subtopics_v_version_default_visualization_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum__subtopics_v_version_default_visualization_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1,
  	"_uuid" varchar
  );
  
  ALTER TABLE "subtopics_default_visualization" ADD CONSTRAINT "subtopics_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subtopics_default_visualization" ADD CONSTRAINT "subtopics_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subtopics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_visualization" ADD CONSTRAINT "_subtopics_v_version_default_visualization_indicator_id_indicators_id_fk" FOREIGN KEY ("indicator_id") REFERENCES "public"."indicators"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_subtopics_v_version_default_visualization" ADD CONSTRAINT "_subtopics_v_version_default_visualization_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_subtopics_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "subtopics_default_visualization_order_idx" ON "subtopics_default_visualization" USING btree ("_order");
  CREATE INDEX "subtopics_default_visualization_parent_id_idx" ON "subtopics_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "subtopics_default_visualization_indicator_idx" ON "subtopics_default_visualization" USING btree ("indicator_id");
  CREATE INDEX "_subtopics_v_version_default_visualization_order_idx" ON "_subtopics_v_version_default_visualization" USING btree ("_order");
  CREATE INDEX "_subtopics_v_version_default_visualization_parent_id_idx" ON "_subtopics_v_version_default_visualization" USING btree ("_parent_id");
  CREATE INDEX "_subtopics_v_version_default_visualization_indicator_idx" ON "_subtopics_v_version_default_visualization" USING btree ("indicator_id");
  ALTER TABLE "indicators" DROP COLUMN "default_visualization_type";
  ALTER TABLE "_indicators_v" DROP COLUMN "version_default_visualization_type";
  DROP TYPE "public"."enum_indicators_default_visualization_type";
  DROP TYPE "public"."enum__indicators_v_version_default_visualization_type";`)
}
