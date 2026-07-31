import type { Access } from "payload";

import { publishedOrAuthenticatedAccess } from "./published";

const callAccess = (user: unknown) =>
  (publishedOrAuthenticatedAccess as Access)({
    req: { user },
  } as Parameters<Access>[0]);

describe("publishedOrAuthenticatedAccess", () => {
  test("restricts an anonymous reader to published records", () => {
    // Returning a constraint rather than false is what keeps content public
    // while hiding work in progress. Verified end to end against Payload 3.79:
    // an anonymous find() excluded a draft and returned only published records.
    expect(callAccess(null)).toEqual({ _status: { equals: "published" } });
    expect(callAccess(undefined)).toEqual({ _status: { equals: "published" } });
  });

  test("lets a logged-in user read drafts", () => {
    expect(callAccess({ id: "1", collection: "admins" })).toBe(true);
    expect(callAccess({ id: "2", collection: "users" })).toBe(true);
  });

  test("never returns false, because the content is public", () => {
    // A false here would break the app, which reads content without a session.
    expect(callAccess(null)).not.toBe(false);
  });
});
