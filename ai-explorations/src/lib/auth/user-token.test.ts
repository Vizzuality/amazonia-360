import { describe, expect, test } from "vitest";

import { getUserPayloadHeaders, getUserTokenCookieOptions } from "./user-token";

const PREFIX = "ai-explorations";

describe("getUserPayloadHeaders", () => {
  test.each(["a%0Ab", "a%0D%0Ab.c.d", "a%00.b.c", "a%C4%80.b.c", "not-a-jwt", "%E0%A4%A"])(
    "treats the malformed user cookie %s as signed out",
    (value) => {
      const headers = getUserPayloadHeaders(
        new Headers({ cookie: `ai-explorations-user-token=${value}` }),
        PREFIX,
      );

      expect(headers.get("authorization")).toBeNull();
    },
  );

  test("turns the user cookie into a JWT header and drops the shared Payload cookie", () => {
    const headers = getUserPayloadHeaders(
      new Headers({
        cookie: "ai-explorations-token=admin; NEXT_LOCALE=es; ai-explorations-user-token=u.s.er",
      }),
      PREFIX,
    );

    expect(headers.get("authorization")).toBe("JWT u.s.er");
    expect(headers.get("cookie")).toBe("NEXT_LOCALE=es; ai-explorations-user-token=u.s.er");
  });

  test("is anonymous without the user cookie, even with an admin session", () => {
    const headers = getUserPayloadHeaders(
      new Headers({ cookie: "ai-explorations-token=admin" }),
      PREFIX,
    );

    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("cookie")).toBeNull();
  });

  test("replaces an incoming Authorization header", () => {
    const withUser = getUserPayloadHeaders(
      new Headers({ authorization: "JWT admin", cookie: "ai-explorations-user-token=u.s.er" }),
      PREFIX,
    );
    const withoutUser = getUserPayloadHeaders(
      new Headers({ authorization: "Bearer admin" }),
      PREFIX,
    );

    expect(withUser.get("authorization")).toBe("JWT u.s.er");
    expect(withoutUser.get("authorization")).toBeNull();
  });

  test("keeps the other request headers", () => {
    const headers = getUserPayloadHeaders(
      new Headers({ "content-type": "application/json", origin: "http://localhost:3100" }),
      PREFIX,
    );

    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("origin")).toBe("http://localhost:3100");
  });
});

describe("getUserTokenCookieOptions", () => {
  const auth = { cookies: { secure: false }, tokenExpiration: 2592000 };

  test("is an HTTP-only, Lax, site-wide cookie that lives as long as the token", () => {
    expect(getUserTokenCookieOptions(auth, "http")).toEqual({
      httpOnly: true,
      maxAge: 2592000,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  test("is Secure over https or when the collection asks for it", () => {
    expect(getUserTokenCookieOptions(auth, "https").secure).toBe(true);
    expect(getUserTokenCookieOptions({ ...auth, cookies: { secure: true } }, "http").secure).toBe(
      true,
    );
  });
});
