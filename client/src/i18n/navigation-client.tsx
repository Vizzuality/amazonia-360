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
