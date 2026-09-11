"use client";

import { forwardRef, useMemo } from "react";

import { createNavigation } from "next-intl/navigation";

import { resolveCountryHref, stripCountry } from "@/lib/country";

import { routing } from "./routing";
import { useCountry } from "./use-country";

const {
  Link: IntlLink,
  usePathname: useIntlPathname,
  useRouter: useIntlRouter,
} = createNavigation(routing);

type IntlLinkProps = React.ComponentProps<typeof IntlLink>;

/**
 * next-intl's `Link`, with the active country prefixed onto scoped hrefs.
 *
 * Everything here sits behind a client boundary because reading the route param needs a
 * hook, and Next rejects a Server Component module that so much as imports one. Server
 * Components render `Link` (`not-found.tsx`, `logo.tsx`), which is fine — they render a
 * client component.
 */
export const Link = forwardRef<HTMLAnchorElement, IntlLinkProps>(function CountryLink(
  { href, ...rest },
  ref,
) {
  const country = useCountry();

  return <IntlLink ref={ref} href={resolveCountryHref(href, country)} {...rest} />;
});

/** The pathname with both the locale and the country removed. */
export function usePathname() {
  const pathname = useIntlPathname();
  return useMemo(() => stripCountry(pathname), [pathname]);
}

/** next-intl's router, with the active country prefixed onto scoped hrefs. */
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
