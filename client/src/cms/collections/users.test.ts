import { vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_URL: "http://localhost:3000",
  },
}));

// Importing the collection pulls in next-auth via the auth strategy, which resolves
// `next/server` in a way vitest cannot follow.
vi.mock("@/cms/auth/authjs-strategy", () => ({
  createAuthjsStrategy: () => ({ name: "authjs", authenticate: vi.fn() }),
  logoutEndpoint: { path: "/logout", method: "post", handler: vi.fn() },
}));

import { findFieldByName } from "@/cms/test-utils/find-field";

import { Users } from "./Users";

const communityOptIn = findFieldByName(Users.fields, "communityOptIn");

const hooks = () => {
  const custom = communityOptIn?.custom as
    | {
        "plugin-import-export"?: {
          hooks?: {
            beforeExport?: (args: { format: string; value: unknown }) => unknown;
            beforeImport?: (args: { format: string; value: unknown }) => unknown;
          };
        };
      }
    | undefined;

  return custom?.["plugin-import-export"]?.hooks;
};

describe("Users communityOptIn", () => {
  test("exists as a checkbox defaulting to opted out", () => {
    expect(communityOptIn?.type).toBe("checkbox");
    expect(communityOptIn?.defaultValue).toBe(false);
  });

  test("is listed in the admin columns so opt-in state is visible without opening a user", () => {
    expect(Users.admin?.defaultColumns).toContain("communityOptIn");
  });

  describe("CSV export", () => {
    // csv-stringify renders booleans as "1" and "", which makes an opt-out
    // indistinguishable from missing data for whoever reads the export.
    test.each([
      { value: true, expected: "true" },
      { value: false, expected: "false" },
      { value: null, expected: "false" },
      { value: undefined, expected: "false" },
    ])("writes $value as $expected", ({ value, expected }) => {
      expect(hooks()?.beforeExport?.({ format: "csv", value })).toBe(expected);
    });

    test("leaves JSON exports as real booleans", () => {
      expect(hooks()?.beforeExport?.({ format: "json", value: true })).toBe(true);
      expect(hooks()?.beforeExport?.({ format: "json", value: false })).toBe(false);
    });
  });

  describe("CSV import", () => {
    test.each([
      { value: "true", expected: true },
      { value: "false", expected: false },
      { value: "", expected: false },
      { value: "1", expected: true },
      { value: true, expected: true },
    ])("reads $value as $expected", ({ value, expected }) => {
      expect(hooks()?.beforeImport?.({ format: "csv", value })).toBe(expected);
    });

    test("leaves JSON imports untouched", () => {
      expect(hooks()?.beforeImport?.({ format: "json", value: true })).toBe(true);
      expect(hooks()?.beforeImport?.({ format: "json", value: false })).toBe(false);
    });
  });
});
