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

/**
 * @vitest-environment node
 */

import { vi } from "vitest";

vi.mock("@/env.mjs", () => ({
  env: {
    NEXT_PUBLIC_WEBSHOT_URL: "http://localhost:3003",
    NEXT_PUBLIC_URL: "http://localhost:3000",
    NEXT_PUBLIC_API_URL: "http://localhost:8000",
    NEXT_PUBLIC_API_KEY: "test",
    NEXT_PUBLIC_ARCGIS_API_KEY: "test",
    BASIC_AUTH_ENABLED: "false",
    BASIC_AUTH_USER: "test",
    BASIC_AUTH_PASSWORD: "test",
    PAYLOAD_SECRET: "test",
    DATABASE_URL: "postgresql://test",
    APP_KEY: "test",
    AUTH_SECRET: "test",
    AWS_SES_IAM_USER_ACCESS_KEY_ID: "test",
    AWS_SES_IAM_USER_SECRET_ACCESS_KEY: "test",
    AWS_SES_REGION: "us-east-1",
  },
}));

vi.mock("@/cms/auth/authjs-strategy", () => ({
  createAuthjsStrategy: vi.fn(() => ({
    name: "authjs",
    authenticate: vi.fn(),
  })),
  logoutEndpoint: { path: "/logout", method: "post", handler: vi.fn() },
}));

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

const noUser = { req: { user: null } } as never;
const admin = { req: { user: { collection: "admins", id: "admin-1" } } } as never;
const signedIn = { req: { user: { collection: "users", id: "user-1" } } } as never;

describe("Users access", () => {
  test.each(["read", "update", "delete"] as const)(
    "%s is scoped to the requesting user and never unrestricted",
    async (operation) => {
      expect(await Users.access?.[operation]?.(noUser)).toBe(false);
      expect(await Users.access?.[operation]?.(admin)).toBe(true);
      // The bug: `or` widened this where-clause into `true`, exposing every account.
      expect(await Users.access?.[operation]?.(signedIn)).toEqual({ id: { equals: "user-1" } });
    },
  );

  test("keeps sign-up open to anyone", async () => {
    expect(await Users.access?.create?.(noUser)).toBe(true);
  });
});
