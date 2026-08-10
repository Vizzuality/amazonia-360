/**
 * next-intl's `router.push` and `redirect` always prepend the active locale
 * (`localePrefix.mode` defaults to "always"). Any URL handed to them must
 * therefore be locale-free, or it ends up double-prefixed as /en/en/....
 */
export const stripLocale = (url: string, locales: readonly string[]): string => {
  const [, maybeLocale, ...rest] = url.split("/");
  return locales.includes(maybeLocale) ? `/${rest.join("/")}` : url;
};

export const isSafeRedirect = (
  url: string | null | undefined,
  locales: readonly string[],
): boolean => {
  if (!url) return false;
  if (!url.startsWith("/") || url.startsWith("//")) return false;

  const pathname = stripLocale(url.split("?")[0], locales);
  return !pathname.startsWith("/auth/");
};
