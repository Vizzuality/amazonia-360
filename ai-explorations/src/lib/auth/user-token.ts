type UsersAuthConfig = { cookies: { secure?: boolean }; tokenExpiration: number };

export function getPayloadTokenCookieName(cookiePrefix: string): string {
  return `${cookiePrefix}-token`;
}

export function getUserTokenCookieName(cookiePrefix: string): string {
  return `${cookiePrefix}-user-token`;
}

function getCookieName(pair: string): string {
  return pair.slice(0, pair.indexOf("=")).trim();
}

const JWT_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

function getCookieValue(pair: string | undefined): string {
  if (!pair) return "";
  try {
    const value = decodeURIComponent(pair.slice(pair.indexOf("=") + 1).trim());
    return JWT_PATTERN.test(value) ? value : "";
  } catch {
    return "";
  }
}

function getCookiePairs(headers: Headers): string[] {
  return (headers.get("cookie") ?? "")
    .split(";")
    .map((pair) => pair.trim())
    .filter((pair) => pair.includes("="));
}

/**
 * Headers that identify the frontend `users` session to Payload: the shared Payload token
 * cookie (the /admin session) is removed and the user cookie becomes `Authorization: JWT`.
 * An incoming Authorization header is dropped either way.
 */
export function getUserPayloadHeaders(headers: Headers, cookiePrefix: string): Headers {
  const payloadCookie = getPayloadTokenCookieName(cookiePrefix);
  const userCookie = getUserTokenCookieName(cookiePrefix);
  const pairs = getCookiePairs(headers);
  const token = getCookieValue(pairs.find((pair) => getCookieName(pair) === userCookie));
  const kept = pairs.filter((pair) => getCookieName(pair) !== payloadCookie);
  const result = new Headers(headers);

  result.delete("authorization");
  result.delete("cookie");
  if (kept.length > 0) result.set("cookie", kept.join("; "));
  if (token) result.set("authorization", `JWT ${token}`);

  return result;
}

export function getUserTokenCookieOptions(auth: UsersAuthConfig, protocol: string) {
  return {
    httpOnly: true,
    maxAge: auth.tokenExpiration,
    path: "/",
    sameSite: "lax" as const,
    secure: Boolean(auth.cookies.secure) || protocol === "https",
  };
}
