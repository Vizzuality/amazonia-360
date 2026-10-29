import { getSingleValue } from "@/lib/search-params";

import { routing } from "@/i18n/routing";

/**
 * `router.push` and `redirect` from `@/i18n/navigation` always prepend the active locale, so
 * any URL handed to them must be locale-free, or it ends up double-prefixed as /en/en/....
 */
export const stripLocale = (url: string, locales: readonly string[]): string => {
  const [, maybeLocale, ...rest] = url.split("/");
  return locales.includes(maybeLocale) ? `/${rest.join("/")}` : url;
};

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code <= 0x1f || code === 0x7f;
  });
}

function hasDotSegment(pathname: string): boolean {
  try {
    return decodeURIComponent(pathname)
      .split("/")
      .some((segment) => segment === "." || segment === "..");
  } catch {
    return true;
  }
}

export const isSafeRedirect = (
  url: string | null | undefined,
  locales: readonly string[],
): boolean => {
  if (!url) return false;
  if (hasControlCharacter(url)) return false;
  // Browsers normalise backslashes to slashes, so /\evil.com
  // navigates off-origin exactly like //evil.com does.
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  if (url.includes("\\")) return false;

  const path = url.split("?")[0];
  if (hasDotSegment(path)) return false;

  const pathname = stripLocale(path, locales);
  if (pathname.startsWith("//")) return false;
  return pathname !== "/auth" && !pathname.startsWith("/auth/");
};

/** Where a signed-in user lands when no usable `redirectUrl` came along. */
export const DEFAULT_SIGNED_IN_REDIRECT = "/private/my-reports";

/**
 * Shared by the sign-in form and the guest gate so both agree on the destination.
 * Accepts the raw query param, which arrives as an array from `searchParams` on the
 * server and from `getAll` on the client. A repeated param has no single answer, so it
 * resolves to the default rather than letting the two sides pick different values.
 */
export const resolveRedirect = (url: string | string[] | null | undefined): string => {
  const target = Array.isArray(url) ? getSingleValue(url) : url;

  if (typeof target !== "string" || !isSafeRedirect(target, routing.locales)) {
    return DEFAULT_SIGNED_IN_REDIRECT;
  }
  return stripLocale(target, routing.locales);
};
