import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "users" SET "community_opt_in" = true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Intentionally empty: the backfill cannot be reversed. Once applied, a true value is
  // indistinguishable from a genuine opt-in, so resetting rows here would silently revoke
  // real consent.
}
