import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_indicators_blocks_imagery_aggregation" AS ENUM('sum', 'mean', 'none');
  CREATE TYPE "public"."enum__indicators_v_blocks_imagery_aggregation" AS ENUM('sum', 'mean', 'none');
  ALTER TABLE "indicators_blocks_imagery" ADD COLUMN "aggregation" "enum_indicators_blocks_imagery_aggregation";
  ALTER TABLE "_indicators_v_blocks_imagery" ADD COLUMN "aggregation" "enum__indicators_v_blocks_imagery_aggregation";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "indicators_blocks_imagery" DROP COLUMN "aggregation";
  ALTER TABLE "_indicators_v_blocks_imagery" DROP COLUMN "aggregation";
  DROP TYPE "public"."enum_indicators_blocks_imagery_aggregation";
  DROP TYPE "public"."enum__indicators_v_blocks_imagery_aggregation";`)
}
