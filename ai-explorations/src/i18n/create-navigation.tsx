import { forwardRef, useMemo } from "react";

import {
  Link as RouterLink,
  redirect as routerRedirect,
  RegisteredRouter,
} from "@tanstack/react-router";

import { Locale, useLocale } from "use-intl";

import {
  NavigateOptions,
  usePathname as useNavigationPathname,
  useRouter as useNavigationRouter,
} from "@/lib/navigation";

type QueryValue = string | number | boolean | null | undefined;

export type Query = Record<string, QueryValue | readonly QueryValue[]>;

export type Href =
  | string
  | {
      pathname: string;
      query?: Query;
      hash?: string;
    };

type Routing = {
  locales: readonly Locale[];
  defaultLocale: Locale;
};

type RouterOptions = NavigateOptions & {
  locale?: Locale;
};

type LinkProps = Omit<React.ComponentProps<"a">, "href" | "ref"> & {
  href: Href;
  locale?: Locale;
  prefetch?: boolean | null;
};

const LOCALE_COOKIE = "NEXT_LOCALE";

function isLocalizableHref(href: Href): boolean {
  const pathname = typeof href === "string" ? href : href.pathname;
  return pathname.startsWith("/") && !/^[a-z]+:/i.test(pathname);
}

function getQueryValue(value: QueryValue): string {
  if (typeof value === "string") return value;
  if ((typeof value === "number" && !Number.isNaN(value)) || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function getSearch(query: Query | undefined): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) searchParams.append(key, getQueryValue(item));
    } else {
      searchParams.set(key, getQueryValue(value as QueryValue));
    }
  }
  const search = searchParams.toString();
  return search ? `?${search}` : "";
}

function getHrefString(href: Href): string {
  if (typeof href === "string") return href;
  const hash = href.hash ? `#${href.hash.replace(/^#/, "")}` : "";
  return `${href.pathname}${getSearch(href.query)}${hash}`;
}

function getPrefixedPathname(locale: Locale, pathname: string): string {
  if (/^\/(\?.*)?$/.test(pathname)) return `/${locale}${pathname.slice(1)}`;
  return `/${locale}${pathname}`;
}

function getUnprefixedPathname(locale: Locale, pathname: string): string {
  const prefix = `/${locale}`;
  if (pathname !== prefix && !pathname.startsWith(`${prefix}/`)) return pathname;
  return pathname.slice(prefix.length) || "/";
}

function getPreload(prefetch: boolean | null | undefined, isChangingLocale: boolean) {
  if (!prefetch || isChangingLocale) return undefined;
  return "viewport";
}

// Mirrors next-intl's `syncLocaleCookie`: a soft navigation never reaches the request
// middleware that sets the cookie, so a locale switch has to write it from the client.
function syncLocaleCookie(locale: Locale, nextLocale: Locale | undefined) {
  if (nextLocale == null || nextLocale === locale) return;
  document.cookie = `${LOCALE_COOKIE}=${nextLocale};sameSite=lax;path=/;`;
}

export function createNavigation(_routing: Routing) {
  function getPathname({ href, locale }: { href: Href; locale: Locale }): string {
    const hrefString = getHrefString(href);
    if (!isLocalizableHref(href)) return hrefString;
    return getPrefixedPathname(locale, hrefString);
  }

  function redirect(args: { href: Href; locale: Locale }): never {
    throw routerRedirect({ href: getPathname(args) });
  }

  const Link = forwardRef<HTMLAnchorElement, LinkProps>(function IntlLink(
    { href, locale, prefetch, onClick, ...rest },
    ref,
  ) {
    const curLocale = useLocale();
    const isChangingLocale = locale != null && locale !== curLocale;
    const finalHref = getPathname({ href, locale: locale ?? curLocale });

    if (!isLocalizableHref(href)) {
      return <a ref={ref} href={finalHref} onClick={onClick} {...rest} />;
    }

    return (
      <RouterLink<RegisteredRouter, string, string>
        ref={ref}
        href={finalHref}
        preload={getPreload(prefetch, isChangingLocale)}
        hrefLang={isChangingLocale ? locale : undefined}
        onClick={(event) => {
          syncLocaleCookie(curLocale, locale);
          onClick?.(event);
        }}
        {...rest}
      />
    );
  });

  function usePathname(): string {
    const pathname = useNavigationPathname();
    const locale = useLocale();
    return useMemo(() => getUnprefixedPathname(locale, pathname), [locale, pathname]);
  }

  function useRouter() {
    const router = useNavigationRouter();
    const curLocale = useLocale();

    return useMemo(() => {
      function getHandler(fn: (href: string, options?: NavigateOptions) => unknown) {
        return (href: Href, options?: RouterOptions) => {
          const { locale: nextLocale, ...rest } = options ?? {};
          syncLocaleCookie(curLocale, nextLocale);
          fn(getPathname({ href, locale: nextLocale ?? curLocale }), rest);
        };
      }

      return {
        push: getHandler(router.push),
        replace: getHandler(router.replace),
        prefetch: getHandler(router.prefetch),
      };
    }, [router, curLocale]);
  }

  return { Link, redirect, getPathname, usePathname, useRouter };
}
