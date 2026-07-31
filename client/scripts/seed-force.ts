/**
 * Seeds the content dataset over the top of whatever is already there (AM-669).
 *
 *   pnpm seed:force
 *
 * **This overwrites editorial content.** Seeding upserts by original id, so every
 * record the dataset covers is restored to the dataset's version — any change an
 * editor made in the admin since the last seed is lost, silently and with no
 * undo. Reach for it only on a fresh environment, or to recover from a seed that
 * failed part way.
 *
 * A separate script rather than `pnpm seed --force` because `payload run`
 * discards every argument after the script path, which would make the flag
 * unreachable and the override a no-op.
 */
import { seedCli } from "@/cms/seed/cli";

// Awaited so `payload run` does not exit the process before the seed finishes.
process.exit(await seedCli({ force: true }));
