import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { getSeedFingerprint } from "./seed-fingerprint";

let clientDir: string;

const write = (file: string, content: string) => {
  mkdirSync(path.dirname(path.join(clientDir, file)), { recursive: true });
  writeFileSync(path.join(clientDir, file), content);
};

beforeEach(() => {
  clientDir = mkdtempSync(path.join(tmpdir(), "seed-fingerprint-"));
  write("datum/topics.json", "[]");
  write("src/cms/seed/seed-topics.ts", "export {};");
  write("src/cms/migrations/index.ts", "export const migrations = [];");
});

afterEach(() => {
  rmSync(clientDir, { recursive: true, force: true });
});

describe("getSeedFingerprint", () => {
  it("is stable for unchanged sources", () => {
    expect(getSeedFingerprint(clientDir, false)).toBe(getSeedFingerprint(clientDir, false));
  });

  it.each([
    ["a datum file", "datum/topics.json", '[{"id":1}]'],
    ["a nested datum file", "datum/indicators/ECU.json", "[]"],
    ["the seed code", "src/cms/seed/seed-topics.ts", "export const x = 1;"],
    ["a migration", "src/cms/migrations/20261028_seed_state.ts", "export {};"],
  ])("changes when %s changes", (_, file, content) => {
    const before = getSeedFingerprint(clientDir, false);
    write(file, content);
    expect(getSeedFingerprint(clientDir, false)).not.toBe(before);
  });

  it("changes with the preview flag", () => {
    expect(getSeedFingerprint(clientDir, true)).not.toBe(getSeedFingerprint(clientDir, false));
  });

  it("ignores test files", () => {
    const before = getSeedFingerprint(clientDir, false);
    write("src/cms/seed/seed-topics.test.ts", "it('x', () => {});");
    expect(getSeedFingerprint(clientDir, false)).toBe(before);
  });
});
