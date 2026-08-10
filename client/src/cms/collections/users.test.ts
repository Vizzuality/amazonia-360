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
