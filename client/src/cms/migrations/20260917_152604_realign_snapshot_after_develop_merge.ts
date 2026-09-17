import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

// Empty on purpose — this migration exists only for its snapshot: `migrate:create` diffs the
// config against the newest snapshot, and develop's predates this branch's countries table.
export async function up({}: MigrateUpArgs): Promise<void> {}

export async function down({}: MigrateDownArgs): Promise<void> {}
