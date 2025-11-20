import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reports_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reports_v_version_topics_indicators_type" AS ENUM('map', 'chart', 'table', 'numeric', 'custom', 'ai');
  CREATE TYPE "public"."enum__reports_v_version_topics_indicators_basemap_id" AS ENUM('gray-vector', 'dark-gray-vector', 'satellite', 'streets', 'hybrid', 'osm', 'topo-vector', 'terrain');
  CREATE TYPE "public"."enum__reports_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__reports_v_published_locale" AS ENUM('en', 'es', 'pt');
  CREATE TABLE "_reports_v_version_topics_indicators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"indicator_id" numeric,
  	"type" "enum__reports_v_version_topics_indicators_type",
  	"x" numeric,
  	"y" numeric,
  	"w" numeric,
  	"h" numeric,
  	"basemap_id" "enum__reports_v_version_topics_indicators_basemap_id" DEFAULT 'gray-vector',
  	"opacity" numeric DEFAULT 1,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_reports_v_version_topics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic_id" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_reports_v_version_topics_locales" (
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_reports_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_location" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__reports_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__reports_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_reports_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_reports_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"anonymous_users_id" integer
  );
  
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "indicator_id" DROP NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "type" DROP NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "x" DROP NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "y" DROP NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "w" DROP NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "h" DROP NOT NULL;
  ALTER TABLE "reports_topics" ALTER COLUMN "topic_id" DROP NOT NULL;
  ALTER TABLE "reports" ALTER COLUMN "location" DROP NOT NULL;
  ALTER TABLE "reports" ADD COLUMN "_status" "enum_reports_status" DEFAULT 'draft';
  ALTER TABLE "_reports_v_version_topics_indicators" ADD CONSTRAINT "_reports_v_version_topics_indicators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reports_v_version_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_version_topics" ADD CONSTRAINT "_reports_v_version_topics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_version_topics_locales" ADD CONSTRAINT "_reports_v_version_topics_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reports_v_version_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v" ADD CONSTRAINT "_reports_v_parent_id_reports_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reports"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_reports_v_locales" ADD CONSTRAINT "_reports_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_reports_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_anonymous_users_fk" FOREIGN KEY ("anonymous_users_id") REFERENCES "public"."anonymous_users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "_reports_v_version_topics_indicators_order_idx" ON "_reports_v_version_topics_indicators" USING btree ("_order");
  CREATE INDEX "_reports_v_version_topics_indicators_parent_id_idx" ON "_reports_v_version_topics_indicators" USING btree ("_parent_id");
  CREATE INDEX "_reports_v_version_topics_order_idx" ON "_reports_v_version_topics" USING btree ("_order");
  CREATE INDEX "_reports_v_version_topics_parent_id_idx" ON "_reports_v_version_topics" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_reports_v_version_topics_locales_locale_parent_id_unique" ON "_reports_v_version_topics_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_reports_v_parent_idx" ON "_reports_v" USING btree ("parent_id");
  CREATE INDEX "_reports_v_version_version_updated_at_idx" ON "_reports_v" USING btree ("version_updated_at");
  CREATE INDEX "_reports_v_version_version_created_at_idx" ON "_reports_v" USING btree ("version_created_at");
  CREATE INDEX "_reports_v_version_version__status_idx" ON "_reports_v" USING btree ("version__status");
  CREATE INDEX "_reports_v_created_at_idx" ON "_reports_v" USING btree ("created_at");
  CREATE INDEX "_reports_v_updated_at_idx" ON "_reports_v" USING btree ("updated_at");
  CREATE INDEX "_reports_v_snapshot_idx" ON "_reports_v" USING btree ("snapshot");
  CREATE INDEX "_reports_v_published_locale_idx" ON "_reports_v" USING btree ("published_locale");
  CREATE INDEX "_reports_v_latest_idx" ON "_reports_v" USING btree ("latest");
  CREATE UNIQUE INDEX "_reports_v_locales_locale_parent_id_unique" ON "_reports_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_reports_v_rels_order_idx" ON "_reports_v_rels" USING btree ("order");
  CREATE INDEX "_reports_v_rels_parent_idx" ON "_reports_v_rels" USING btree ("parent_id");
  CREATE INDEX "_reports_v_rels_path_idx" ON "_reports_v_rels" USING btree ("path");
  CREATE INDEX "_reports_v_rels_users_id_idx" ON "_reports_v_rels" USING btree ("users_id");
  CREATE INDEX "_reports_v_rels_anonymous_users_id_idx" ON "_reports_v_rels" USING btree ("anonymous_users_id");
  CREATE INDEX "reports__status_idx" ON "reports" USING btree ("_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_reports_v_version_topics_indicators" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_version_topics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_version_topics_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_reports_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_reports_v_version_topics_indicators" CASCADE;
  DROP TABLE "_reports_v_version_topics" CASCADE;
  DROP TABLE "_reports_v_version_topics_locales" CASCADE;
  DROP TABLE "_reports_v" CASCADE;
  DROP TABLE "_reports_v_locales" CASCADE;
  DROP TABLE "_reports_v_rels" CASCADE;
  DROP INDEX "reports__status_idx";
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "indicator_id" SET NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "type" SET NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "x" SET NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "y" SET NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "w" SET NOT NULL;
  ALTER TABLE "reports_topics_indicators" ALTER COLUMN "h" SET NOT NULL;
  ALTER TABLE "reports_topics" ALTER COLUMN "topic_id" SET NOT NULL;
  ALTER TABLE "reports" ALTER COLUMN "location" SET NOT NULL;
  ALTER TABLE "reports" DROP COLUMN "_status";
  DROP TYPE "public"."enum_reports_status";
  DROP TYPE "public"."enum__reports_v_version_topics_indicators_type";
  DROP TYPE "public"."enum__reports_v_version_topics_indicators_basemap_id";
  DROP TYPE "public"."enum__reports_v_version_status";
  DROP TYPE "public"."enum__reports_v_published_locale";`)
}
