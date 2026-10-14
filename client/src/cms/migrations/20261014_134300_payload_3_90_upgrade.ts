import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "admins" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "reset_password_requested_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "admins" DROP COLUMN "reset_password_requested_at";
  ALTER TABLE "users" DROP COLUMN "reset_password_requested_at";`)
}
