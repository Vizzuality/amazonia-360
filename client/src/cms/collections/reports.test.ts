/**
 * @vitest-environment node
 */
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
});
