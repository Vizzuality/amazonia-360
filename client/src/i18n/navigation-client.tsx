"use client";

import { forwardRef, useCallback, useMemo } from "react";

import { useLocale } from "next-intl";
import { createNavigation } from "next-intl/navigation";

import { resolveCountryHref, stripCountry } from "@/lib/country";

import { routing } from "./routing";
import { useCountry } from "./use-country";

const {
  Link: IntlLink,
  usePathname: useIntlPathname,
  useRouter: useIntlRouter,
  getPathname,
} = createNavigation(routing);

type IntlLinkProps = React.ComponentProps<typeof IntlLink>;

// Behind a client boundary because reading the module needs a hook, and Next rejects a
// Server Component module that so much as imports one.
export const Link = forwardRef<HTMLAnchorElement, IntlLinkProps>(function CountryLink(
  { href, ...rest },
  ref,
) {
  const country = useCountry();

  return <IntlLink ref={ref} href={resolveCountryHref(href, country)} {...rest} />;
});

// For links to a module other than the active one. `Link` would prefix the href with the
// module you are *in*, which is wrong for the Amazon Region, whose path names none.
export const LocaleLink = IntlLink;

export function usePathname() {
  const pathname = useIntlPathname();
  return useMemo(() => stripCountry(pathname), [pathname]);
}

export function useRouter() {
  const router = useIntlRouter();
  const country = useCountry();

  return useMemo(
    () => ({
      ...router,
      push: ((href, options) =>
        router.push(resolveCountryHref(href, country), options)) as typeof router.push,
      replace: ((href, options) =>
        router.replace(resolveCountryHref(href, country), options)) as typeof router.replace,
      prefetch: ((href, options) =>
        router.prefetch(resolveCountryHref(href, country), options)) as typeof router.prefetch,
    }),
    [router, country],
  );
}

/**
 * Navigates with a full page load. Every auth-state transition must use this: a soft
 * navigation is answered from the client Router Cache, which holds the auth gate's
 * redirect from back when the target was prefetched under the previous session, and
 * replaying it bounces the user straight back to sign-in.
 */
export function useHardNavigate() {
  const locale = useLocale();
  const country = useCountry();

  return useCallback(
    (href: string) => {
      window.location.assign(getPathname({ href: resolveCountryHref(href, country), locale }));
    },
    [country, locale],
  );
}
