#!/usr/bin/env node
/**
 * Runs a Payload CLI step and makes it prove it actually ran.
 *
 * The CLI loads `payload.config.ts` through a dynamic `import()`. With `prismjs` in the
 * dependency graph that import intermittently never settles, and node exits 0 once the
 * event loop drains: no output, no error, nothing done. Payload described the mechanism
 * itself in payloadcms/payload#9382 and shipped a fix, but `@payloadcms/richtext-lexical`
 * -> `@lexical/react` -> `@lexical/markdown` -> `@lexical/code` puts prismjs straight back
 * into our graph. The open report is payloadcms/payload#17757; measured there at 15-20%
 * per invocation back to back, and at ~2.5% spread across CI steps like ours.
 *
 * A no-op `migrate` leaves e2e to fail fifteen specs that each read as a product bug, and
 * a no-op `migrate` on the production entrypoint boots the app against an unmigrated
 * database. Both steps are idempotent -- `migrate` skips what it has already applied and
 * the seeders upsert -- so the fix is to insist on the completion line each step prints
 * and run it again when it is missing.
 *
 * Only the silent no-op is retried. A non-zero exit is a real failure and a step that
 * stops producing output is a different bug; both are reported as they happen.
 *
 * Usage: node scripts/payload-step.mjs <migrate|seed>
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAYLOAD_BIN = path.join(CLIENT_DIR, "node_modules", ".bin", "payload");

const ATTEMPTS = 3;

const STEPS = {
  migrate: {
    args: ["migrate"],
    // bin/migrate.js logs this once the adapter returns, including the path where there
    // was nothing left to apply.
    provesItRan: /Done\./,
    timeoutMs: 3 * 60_000,
  },
  seed: {
    args: ["run", "src/cms/seed/seed-data.ts"],
    // seed-data.ts's last line before it exits 0. A short seed logs "Seed incomplete" and
    // exits 1 instead, which is a real failure and not ours to retry.
    provesItRan: /Seeded \d+ topics/,
    timeoutMs: 5 * 60_000,
    // `payload run` does not set this, so seeding connects as a dev server would and
    // pushes the schema -- which writes the batch -1 row that makes the *next* migrate
    // stop on "data loss will occur, proceed?" and wait on stdin forever. migrate has
    // already built the schema by the time we get here, so there is nothing to push.
    // The flag's only consumer is that push gate in db-postgres' connect().
    env: { PAYLOAD_MIGRATING: "true" },
  },
};

/**
 * Forwards the child's output as it arrives so CI logs read exactly as before, and keeps a
 * copy to look for the completion line in.
 */
function runOnce({ args, env, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(PAYLOAD_BIN, args, {
      cwd: CLIENT_DIR,
      env: { ...process.env, ...env },
      stdio: ["inherit", "pipe", "pipe"],
    });

    let output = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    for (const [stream, sink] of [
      [child.stdout, process.stdout],
      [child.stderr, process.stderr],
    ]) {
      stream.on("data", (chunk) => {
        output += chunk;
        sink.write(chunk);
      });
    }

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output, timedOut });
    });
  });
}

async function main() {
  const name = process.argv[2];
  const step = STEPS[name];

  if (!step) {
    console.error(
      `Unknown step "${name ?? ""}". Available steps: ${Object.keys(STEPS).join(", ")}.`,
    );
    process.exit(1);
  }

  // The Dockerfile copies node_modules and scripts into the runner image separately, so
  // say which one is missing rather than failing on a spawn ENOENT.
  if (!existsSync(PAYLOAD_BIN)) {
    console.error(`No payload binary at ${PAYLOAD_BIN}. Run pnpm install.`);
    process.exit(1);
  }

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const { code, output, timedOut } = await runOnce(step);

    if (timedOut) {
      console.error(
        `\npayload ${step.args.join(" ")} produced no exit after ${step.timeoutMs / 60_000}m and was killed. ` +
          `It is most likely waiting on the dev-push confirmation prompt, which happens when ` +
          `payload_migrations holds a batch -1 row written by a dev server.`,
      );
      process.exit(1);
    }

    if (code !== 0) {
      process.exit(code ?? 1);
    }

    if (step.provesItRan.test(output)) {
      process.exit(0);
    }

    console.error(
      `\npayload ${step.args.join(" ")} exited 0 without running (attempt ${attempt} of ${ATTEMPTS}): ` +
        `no "${step.provesItRan.source}" in its output. This is payloadcms/payload#17757.`,
    );
  }

  console.error(
    `\nGiving up after ${ATTEMPTS} silent no-ops. That is far past what #17757's failure rate ` +
      `explains, so treat the config import as broken rather than flaky.`,
  );
  process.exit(1);
}

await main();
