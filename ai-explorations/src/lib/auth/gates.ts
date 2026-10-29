import { getGlobalStartContext } from "@tanstack/react-start";

import { ParsedLocation } from "@tanstack/react-router";

import { QueryClient } from "@tanstack/react-query";
import { Locale } from "use-intl";

import { getSessionQueryOptions } from "@/lib/auth/react";
import { resolveRedirect, stripLocale } from "@/lib/auth/redirect-url";

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type GateOptions = {
  context: { queryClient: QueryClient; locale: Locale };
  location: ParsedLocation;
  params: { country?: string };
  routeId: string;
};

const URL_BASE = "http://localhost";

// `fetchQuery`, not `ensureQueryData`: the latter hands back invalidated data after sign-out.
async function hasUserSession(queryClient: QueryClient): Promise<boolean> {
  const session = await queryClient.fetchQuery(getSessionQueryOptions());
  return session?.user.collection === "users";
}

function getRequestUrl(location: ParsedLocation): string {
  return getGlobalStartContext()?.currentUrl ?? `${location.pathname}${location.searchStr}`;
}

function getReturnUrl({ location, params }: GateOptions): string {
  const url = getRequestUrl(location);
  return params.country ? url.split("?")[0] : url;
}

export async function requireUserBeforeLoad(options: GateOptions): Promise<void> {
  if (await hasUserSession(options.context.queryClient)) return;

  const redirectUrl = encodeURIComponent(stripLocale(getReturnUrl(options), routing.locales));
  redirect({ locale: options.context.locale, href: `/auth/sign-in?redirectUrl=${redirectUrl}` });
}

type RouteMatches = { matches?: readonly { routeId: string }[] };

// `matches` is read untyped: declaring it on GateOptions makes TS infer the route-match union
// while it is still inferring the layout's own `Route`, which fails with TS7022.
function isLayoutIndexMatch(options: GateOptions): boolean {
  const { matches } = options as GateOptions & RouteMatches;
  return matches?.at(-1)?.routeId === `${options.routeId}/`;
}

/** For a layout whose own path is a 404 for everyone, signed in or not. */
export async function requireUserBelowIndexBeforeLoad(options: GateOptions): Promise<void> {
  if (isLayoutIndexMatch(options)) return;
  await requireUserBeforeLoad(options);
}

export async function requireGuestBeforeLoad(options: GateOptions): Promise<void> {
  if (!(await hasUserSession(options.context.queryClient))) return;

  const { searchParams } = new URL(getRequestUrl(options.location), URL_BASE);
  redirect({
    locale: options.context.locale,
    href: resolveRedirect(searchParams.getAll("redirectUrl")),
  });
}
