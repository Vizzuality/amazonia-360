import { ownUserAccess } from "./owner";

describe("ownUserAccess", () => {
  test("denies unauthenticated requests", () => {
    expect(ownUserAccess({ req: { user: null } } as never)).toBe(false);
  });

  test("grants admins unrestricted access", () => {
    expect(ownUserAccess({ req: { user: { collection: "admins", id: "a1" } } } as never)).toBe(
      true,
    );
  });

  test("scopes a signed-in user to their own documents", () => {
    expect(ownUserAccess({ req: { user: { collection: "users", id: "u1" } } } as never)).toEqual({
      "user.value": { equals: "u1" },
      "user.relationTo": { equals: "users" },
    });
  });

  test("no longer recognises the removed anonymous-users collection", () => {
    expect(
      ownUserAccess({ req: { user: { collection: "anonymous-users", id: "x1" } } } as never),
    ).toBe(false);
  });
});
