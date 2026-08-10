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

import { Reports } from "./Reports";

const noUser = { req: { user: null } } as never;
const admin = { req: { user: { collection: "admins", id: "admin-1" } } } as never;
const signedIn = { req: { user: { collection: "users", id: "user-1" } } } as never;

const OWNER_CONSTRAINT = {
  "user.value": { equals: "user-1" },
  "user.relationTo": { equals: "users" },
};

describe("Reports access", () => {
  test.each(["update", "delete"] as const)(
    "%s is scoped to the owner and never unrestricted",
    async (operation) => {
      expect(await Reports.access?.[operation]?.(noUser)).toBe(false);
      expect(await Reports.access?.[operation]?.(admin)).toBe(true);
      expect(await Reports.access?.[operation]?.(signedIn)).toEqual(OWNER_CONSTRAINT);
    },
  );

  test("keeps drafts enabled so the admin panel can roll back a bad edit", () => {
    expect(Reports.versions).toEqual({ drafts: true });
  });

  test.each(["read", "create"] as const)("%s requires a signed-in account", async (operation) => {
    expect(await Reports.access?.[operation]?.(noUser)).toBe(false);
    expect(await Reports.access?.[operation]?.(signedIn)).toBe(true);
    expect(await Reports.access?.[operation]?.(admin)).toBe(true);
  });

  test("owns reports through a single-target polymorphic relationship", () => {
    const user = Reports.fields.find((field) => "name" in field && field.name === "user") as {
      relationTo: string[];
    };

    expect(user.relationTo).toEqual(["users"]);
  });
});
