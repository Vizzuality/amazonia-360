import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_country_modules_country" AS ENUM('BRA', 'COL', 'PER', 'VEN', 'ECU', 'BOL', 'GUY', 'SUR');
  CREATE TYPE "public"."enum_partners_logo_size" AS ENUM('default', 'large');
  CREATE TABLE "country_modules" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"slug" varchar NOT NULL,
  	"country" "enum_country_modules_country" NOT NULL,
  	"active" boolean DEFAULT false,
  	"tag" varchar NOT NULL,
  	"bbox_xmin" numeric,
  	"bbox_ymin" numeric,
  	"bbox_xmax" numeric,
  	"bbox_ymax" numeric,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "country_modules_locales" (
  	"name" varchar NOT NULL,
  	"module_name" varchar NOT NULL,
  	"partners_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"tag" varchar,
  	"logo_size" "enum_partners_logo_size" DEFAULT 'default',
  	"regional" boolean DEFAULT false,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners_locales" (
  	"logo" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" uuid NOT NULL
  );
  
  CREATE TABLE "partners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"country_modules_id" uuid
  );
  
  CREATE TABLE "indicators_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"partners_id" uuid
  );
  
  CREATE TABLE "_indicators_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"partners_id" uuid
  );
  
  ALTER TABLE "reports_rels" ADD COLUMN "country_modules_id" uuid;
  ALTER TABLE "_reports_v_rels" ADD COLUMN "country_modules_id" uuid;
  ALTER TABLE "indicators" ADD COLUMN "module_id" uuid;
  ALTER TABLE "_indicators_v" ADD COLUMN "version_module_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "country_modules_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partners_id" uuid;
  ALTER TABLE "country_modules_locales" ADD CONSTRAINT "country_modules_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."country_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_country_modules_fk" FOREIGN KEY ("country_modules_id") REFERENCES "public"."country_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_rels" ADD CONSTRAINT "indicators_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."indicators"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators_rels" ADD CONSTRAINT "indicators_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_rels" ADD CONSTRAINT "_indicators_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_indicators_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_indicators_v_rels" ADD CONSTRAINT "_indicators_v_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "country_modules_slug_idx" ON "country_modules" USING btree ("slug");
  CREATE INDEX "country_modules_updated_at_idx" ON "country_modules" USING btree ("updated_at");
  CREATE INDEX "country_modules_created_at_idx" ON "country_modules" USING btree ("created_at");
  CREATE UNIQUE INDEX "country_modules_locales_locale_parent_id_unique" ON "country_modules_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_rels_order_idx" ON "partners_rels" USING btree ("order");
  CREATE INDEX "partners_rels_parent_idx" ON "partners_rels" USING btree ("parent_id");
  CREATE INDEX "partners_rels_path_idx" ON "partners_rels" USING btree ("path");
  CREATE INDEX "partners_rels_country_modules_id_idx" ON "partners_rels" USING btree ("country_modules_id");
  CREATE INDEX "indicators_rels_order_idx" ON "indicators_rels" USING btree ("order");
  CREATE INDEX "indicators_rels_parent_idx" ON "indicators_rels" USING btree ("parent_id");
  CREATE INDEX "indicators_rels_path_idx" ON "indicators_rels" USING btree ("path");
  CREATE INDEX "indicators_rels_partners_id_idx" ON "indicators_rels" USING btree ("partners_id");
  CREATE INDEX "_indicators_v_rels_order_idx" ON "_indicators_v_rels" USING btree ("order");
  CREATE INDEX "_indicators_v_rels_parent_idx" ON "_indicators_v_rels" USING btree ("parent_id");
  CREATE INDEX "_indicators_v_rels_path_idx" ON "_indicators_v_rels" USING btree ("path");
  CREATE INDEX "_indicators_v_rels_partners_id_idx" ON "_indicators_v_rels" USING btree ("partners_id");
  ALTER TABLE "reports_rels" ADD CONSTRAINT "reports_rels_country_modules_fk" FOREIGN KEY ("country_modules_id") REFERENCES "public"."country_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_reports_v_rels" ADD CONSTRAINT "_reports_v_rels_country_modules_fk" FOREIGN KEY ("country_modules_id") REFERENCES "public"."country_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "indicators" ADD CONSTRAINT "indicators_module_id_country_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."country_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_indicators_v" ADD CONSTRAINT "_indicators_v_version_module_id_country_modules_id_fk" FOREIGN KEY ("version_module_id") REFERENCES "public"."country_modules"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_country_modules_fk" FOREIGN KEY ("country_modules_id") REFERENCES "public"."country_modules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reports_rels_country_modules_id_idx" ON "reports_rels" USING btree ("country_modules_id");
  CREATE INDEX "_reports_v_rels_country_modules_id_idx" ON "_reports_v_rels" USING btree ("country_modules_id");
  CREATE INDEX "indicators_module_idx" ON "indicators" USING btree ("module_id");
  CREATE INDEX "_indicators_v_version_version_module_idx" ON "_indicators_v" USING btree ("version_module_id");
  CREATE INDEX "payload_locked_documents_rels_country_modules_id_idx" ON "payload_locked_documents_rels" USING btree ("country_modules_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reports_rels" DROP CONSTRAINT "reports_rels_country_modules_fk";
  ALTER TABLE "_reports_v_rels" DROP CONSTRAINT "_reports_v_rels_country_modules_fk";
  ALTER TABLE "indicators" DROP CONSTRAINT "indicators_module_id_country_modules_id_fk";
  ALTER TABLE "_indicators_v" DROP CONSTRAINT "_indicators_v_version_module_id_country_modules_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_country_modules_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";
  ALTER TABLE "country_modules" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "country_modules_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "indicators_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_indicators_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "country_modules" CASCADE;
  DROP TABLE "country_modules_locales" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "partners_rels" CASCADE;
  DROP TABLE "indicators_rels" CASCADE;
  DROP TABLE "_indicators_v_rels" CASCADE;
  DROP INDEX "reports_rels_country_modules_id_idx";
  DROP INDEX "_reports_v_rels_country_modules_id_idx";
  DROP INDEX "indicators_module_idx";
  DROP INDEX "_indicators_v_version_version_module_idx";
  DROP INDEX "payload_locked_documents_rels_country_modules_id_idx";
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  ALTER TABLE "reports_rels" DROP COLUMN "country_modules_id";
  ALTER TABLE "_reports_v_rels" DROP COLUMN "country_modules_id";
  ALTER TABLE "indicators" DROP COLUMN "module_id";
  ALTER TABLE "_indicators_v" DROP COLUMN "version_module_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "country_modules_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  DROP TYPE "public"."enum_country_modules_country";
  DROP TYPE "public"."enum_partners_logo_size";`)
}
