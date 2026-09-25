import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

import { COUNTRIES } from "@/constants/countries";

import { findFieldByName } from "@/cms/test-utils/find-field";

/**
 * @vitest-environment node
 */

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

const countriesOfInterest = findFieldByName(Users.fields, "countriesOfInterest");

const countriesHooks = () => {
  const custom = countriesOfInterest?.custom as
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

describe("Users countriesOfInterest", () => {
  test("exists as a multi-select field", () => {
    expect(countriesOfInterest?.type).toBe("select");
    expect((countriesOfInterest as { hasMany?: boolean })?.hasMany).toBe(true);
  });

  test("offers exactly the countries constant as options", () => {
    const options = (countriesOfInterest as { options?: { value: string }[] })?.options;
    expect(options).toHaveLength(8);
    expect(options?.map((option) => option.value)).toEqual(COUNTRIES.map(({ iso3 }) => iso3));
  });

  test("is listed in the admin columns so selections are visible without opening a user", () => {
    expect(Users.admin?.defaultColumns).toContain("countriesOfInterest");
  });

  describe("CSV export", () => {
    test.each([
      { value: ["COL", "BRA"], expected: "BRA|COL" },
      { value: [], expected: "" },
      { value: null, expected: "" },
      { value: undefined, expected: "" },
    ])("writes $value as $expected", ({ value, expected }) => {
      expect(countriesHooks()?.beforeExport?.({ format: "csv", value })).toBe(expected);
    });

    test("leaves JSON exports untouched", () => {
      expect(countriesHooks()?.beforeExport?.({ format: "json", value: ["BRA", "COL"] })).toEqual([
        "BRA",
        "COL",
      ]);
    });
  });

  describe("CSV import", () => {
    test.each([
      { value: "BRA|COL", expected: ["BRA", "COL"] },
      { value: "", expected: [] },
      { value: undefined, expected: [] },
    ])("reads $value as $expected", ({ value, expected }) => {
      expect(countriesHooks()?.beforeImport?.({ format: "csv", value })).toEqual(expected);
    });

    test("leaves JSON imports untouched", () => {
      expect(countriesHooks()?.beforeImport?.({ format: "json", value: ["BRA", "COL"] })).toEqual([
        "BRA",
        "COL",
      ]);
    });
  });
});

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const COUNTRIES_ENUM_KEY = "public.enum_users_countries_of_interest";

// Options come from COUNTRIES at runtime, but the Postgres enum is frozen at whatever
// migration last declared it — a new country can pass tsc and work locally (dev auto-pushes
// the schema) while dying in production with a bare 22P02 invalid enum value on sign-up.
function getLatestCountriesEnumValues(): string[] {
  const snapshots = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .reverse();

  for (const file of snapshots) {
    const snapshot = JSON.parse(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8")) as {
      enums?: Record<string, { values: string[] }>;
    };
    const enumDef = snapshot.enums?.[COUNTRIES_ENUM_KEY];
    if (enumDef) {
      return enumDef.values;
    }
  }

  throw new Error(`No migration snapshot declares ${COUNTRIES_ENUM_KEY}`);
}

describe("Users countriesOfInterest migration enum", () => {
  test("matches COUNTRIES exactly, so a new country can't reach a frozen DB enum", () => {
    const enumValues = getLatestCountriesEnumValues();
    const configuredCodes: readonly string[] = COUNTRIES.map(({ iso3 }) => iso3);

    const missingFromMigration = configuredCodes.filter((code) => !enumValues.includes(code));
    const missingFromConfig = enumValues.filter((code) => !configuredCodes.includes(code));

    expect(
      missingFromMigration,
      `in COUNTRIES but not in the migration enum: ${missingFromMigration.join(", ")} — run pnpm payload migrate:create`,
    ).toEqual([]);
    expect(
      missingFromConfig,
      `in the migration enum but not in COUNTRIES: ${missingFromConfig.join(", ")} — run pnpm payload migrate:create`,
    ).toEqual([]);
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
