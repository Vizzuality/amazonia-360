import { describe, expect, test, vi } from "vitest";

import { getSession } from "./session";

type PayloadStub = Parameters<typeof getSession>[0];

const HEADERS = new Headers({ cookie: "ai-explorations-token=token" });

function getPayloadStub(user: unknown) {
  const auth = vi.fn().mockResolvedValue({ permissions: {}, user });
  return { payload: { auth } as unknown as PayloadStub, auth };
}

describe("getSession", () => {
  test("maps a users token to the session the frontend reads", async () => {
    const { payload, auth } = getPayloadStub({
      id: "user-1",
      collection: "users",
      name: "Ana",
      email: "ana@example.com",
      image: null,
    });

    await expect(getSession(payload, HEADERS)).resolves.toEqual({
      user: {
        id: "user-1",
        collection: "users",
        name: "Ana",
        email: "ana@example.com",
        image: null,
      },
    });
    expect(auth).toHaveBeenCalledWith({ headers: HEADERS });
  });

  test("treats an admin token as signed out", async () => {
    const { payload } = getPayloadStub({
      id: "admin-1",
      collection: "admins",
      email: "admin@example.com",
    });

    await expect(getSession(payload, HEADERS)).resolves.toBeNull();
  });

  test("returns no session without a valid token", async () => {
    const { payload } = getPayloadStub(null);

    await expect(getSession(payload, HEADERS)).resolves.toBeNull();
  });
});
