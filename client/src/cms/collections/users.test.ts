/**
 * @vitest-environment node
 */
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
