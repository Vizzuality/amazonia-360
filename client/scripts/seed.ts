/**
 * Seeds the reviewed content dataset into the CMS (AM-669).
 *
 *   pnpm seed
 *
 * Refuses a database that already holds content. Use `pnpm seed:force` to
 * overwrite — a separate script because `payload run` discards arguments, so
 * `pnpm seed --force` would silently seed without forcing.
 *
 * Runs against whatever database the environment points at, so the same command
 * serves local, develop, staging and production.
 */
import { seedCli } from "@/cms/seed/cli";

// Awaited so `payload run` does not exit the process before the seed finishes.
process.exit(await seedCli({ force: false }));
