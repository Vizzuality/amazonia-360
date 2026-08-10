import type { AuthStrategyFunctionArgs, Payload } from "payload";

import { vi } from "vitest";

const auth = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => auth(),
  signOut: vi.fn(),
}));

import { createAuthjsStrategy } from "./authjs-strategy";

const SESSION = { user: { id: "user-1" } };
const USER_DOC = { id: "user-1", email: "someone@example.org" };

const findByID = vi.fn();
const payload = { findByID } as unknown as Payload;

const authenticate = (headers: Record<string, string>) =>
  createAuthjsStrategy("users").authenticate({
    headers: new Headers(headers),
    payload,
  } as AuthStrategyFunctionArgs);

beforeEach(() => {
  auth.mockResolvedValue(SESSION);
  findByID.mockResolvedValue(USER_DOC);
});

describe("createAuthjsStrategy — admin traffic steps aside", () => {
  // Payload appends its own `local-jwt` strategy last and stops at the first strategy
  // returning a user, so returning null here is what lets an admin's payload-token be
  // read at all. Resolving a session instead is the 403-on-every-save bug.
  test("returns no user for an /admin page load", async () => {
    await expect(authenticate({ "x-current-path": "/admin" })).resolves.toEqual({ user: null });
    expect(auth).not.toHaveBeenCalled();
  });

  test("returns no user for a nested /admin page load", async () => {
    await expect(authenticate({ "x-current-path": "/admin/collections/topics" })).resolves.toEqual({
      user: null,
    });
  });

  // The regression: the panel writes to /v1/api/*, which is outside the middleware
  // matcher, so x-current-path never arrives. Only the Referer identifies these.
  test("returns no user for a panel write to /v1/api, which carries no x-current-path", async () => {
    await expect(
      authenticate({ referer: "http://localhost:3000/admin/collections/topics/abc" }),
    ).resolves.toEqual({ user: null });
    expect(auth).not.toHaveBeenCalled();
  });

  test("returns no user when there is no Referer at all", async () => {
    await expect(authenticate({})).resolves.toEqual({ user: null });
  });

  test("returns no user when the Referer is unparseable", async () => {
    await expect(authenticate({ referer: "not a url" })).resolves.toEqual({ user: null });
  });
});

describe("createAuthjsStrategy — public app traffic resolves the session", () => {
  test("resolves the NextAuth session for a request from a public page", async () => {
    await expect(authenticate({ referer: "http://localhost:3000/es/reports/1" })).resolves.toEqual({
      user: { ...USER_DOC, collection: "users" },
    });

    expect(findByID).toHaveBeenCalledWith({
      collection: "users",
      id: "user-1",
      disableErrors: true,
    });
  });

  // Guards the /admin check against substring matching: a public route may legitimately
  // start with the same letters.
  test("treats a public path that merely starts with 'admin' as public", async () => {
    await expect(
      authenticate({ referer: "http://localhost:3000/es/administracion" }),
    ).resolves.toEqual({ user: { ...USER_DOC, collection: "users" } });
  });

  test("returns no user when there is no session", async () => {
    auth.mockResolvedValue(null);

    await expect(authenticate({ referer: "http://localhost:3000/es/reports/1" })).resolves.toEqual({
      user: null,
    });
    expect(findByID).not.toHaveBeenCalled();
  });

  test("returns no user when the session points at a document that no longer exists", async () => {
    findByID.mockResolvedValue(null);

    await expect(authenticate({ referer: "http://localhost:3000/es/reports/1" })).resolves.toEqual({
      user: null,
    });
  });

  test("resolves against the collection it was built for", async () => {
    await createAuthjsStrategy("users").authenticate({
      headers: new Headers({ referer: "http://localhost:3000/es/reports/1" }),
      payload,
    } as AuthStrategyFunctionArgs);

    expect(findByID).toHaveBeenCalledWith({
      collection: "users",
      id: "user-1",
      disableErrors: true,
    });
  });
});
