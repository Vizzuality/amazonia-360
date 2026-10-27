import { describe, expect, test, vi } from "vitest";

import { getSession } from "./session";

type PayloadStub = Parameters<typeof getSession>[0];

const USER_HEADERS = new Headers({ cookie: "ai-explorations-user-token=u.s.er" });
const ADMIN_HEADERS = new Headers({ cookie: "ai-explorations-token=admin" });

const USERS: Record<string, unknown> = {
  "JWT u.s.er": {
    id: "user-1",
    collection: "users",
    name: "Ana",
    email: "ana@example.com",
    image: null,
  },
  "JWT admin": { id: "admin-1", collection: "admins", email: "admin@example.com" },
};

/** Resolves a user the way Payload does: the Authorization header first, then its own cookie. */
function getPayloadStub(users: Record<string, unknown> = USERS) {
  const auth = vi.fn(async ({ headers }: { headers: Headers }) => {
    const token = /ai-explorations-token=(\w+)/.exec(headers.get("cookie") ?? "")?.[1];
    const authorization = headers.get("authorization") ?? `JWT ${token}`;
    return { permissions: {}, user: users[authorization] ?? null };
  });

  return {
    payload: { auth, config: { cookiePrefix: "ai-explorations" } } as unknown as PayloadStub,
    auth,
  };
}

describe("getSession", () => {
  test("maps the user cookie's user to the session the frontend reads", async () => {
    const { payload } = getPayloadStub();

    await expect(getSession(payload, USER_HEADERS)).resolves.toEqual({
      user: {
        id: "user-1",
        collection: "users",
        name: "Ana",
        email: "ana@example.com",
        image: null,
      },
    });
  });

  test("is signed out with only the admin cookie", async () => {
    const { payload, auth } = getPayloadStub();

    await expect(getSession(payload, ADMIN_HEADERS)).resolves.toBeNull();
    expect(auth.mock.calls[0][0].headers.get("cookie")).toBeNull();
  });

  test("treats a user cookie holding an admin token as signed out", async () => {
    const { payload } = getPayloadStub({ "JWT u.s.er": USERS["JWT admin"] });

    await expect(getSession(payload, USER_HEADERS)).resolves.toBeNull();
  });

  test("returns no session without a valid token", async () => {
    const { payload } = getPayloadStub({});

    await expect(getSession(payload, USER_HEADERS)).resolves.toBeNull();
  });
});
