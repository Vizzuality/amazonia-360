import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Only rows whose address is proven get the retroactive opt-in: either the user completed
  // Payload email verification, or an OAuth provider vouched for the address (adapter.ts skips
  // the verification email for OAuth signups, so `_verified` stays false for them).
  await db.execute(sql`
   UPDATE "users" SET "community_opt_in" = true
   WHERE "_verified" = true
      OR EXISTS (SELECT 1 FROM "accounts" WHERE "accounts"."user_id" = "users"."id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Intentionally empty: the backfill cannot be reversed. Once applied, a true value is
  // indistinguishable from a genuine opt-in, so resetting rows here would silently revoke
  // real consent.
}
