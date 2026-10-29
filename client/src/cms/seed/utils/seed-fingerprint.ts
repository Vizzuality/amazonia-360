import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SOURCES = ["datum", "src/cms/seed", "src/cms/migrations"] as const;

function getSourceFiles(clientDir: string, source: string): string[] {
  return readdirSync(path.join(clientDir, source), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !/\.test\.tsx?$/.test(entry.name))
    .map((entry) => path.relative(clientDir, path.join(entry.parentPath, entry.name)))
    .sort();
}

export function getSeedFingerprint(clientDir: string, preview: boolean): string {
  const hash = createHash("sha256");
  hash.update(`preview:${preview}\n`);
  for (const source of SOURCES) {
    for (const file of getSourceFiles(clientDir, source)) {
      hash.update(`${file}\n`);
      hash.update(readFileSync(path.join(clientDir, file)));
    }
  }
  return hash.digest("hex");
}
