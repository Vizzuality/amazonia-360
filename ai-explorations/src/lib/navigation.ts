import { useMemo } from "react";

import {
  notFound as getNotFound,
  RegisteredRouter,
  useLocation,
  useParams as useRouterParams,
  useRouter as useTanStackRouter,
} from "@tanstack/react-router";

export type ParamValue = string | string[] | undefined;
export type Params = Record<string, ParamValue>;

export type NavigateOptions = {
  scroll?: boolean;
};

export function notFound(): never {
  throw getNotFound();
}

function getPathnameFromHref(href: string): string {
  return new URL(href, "http://localhost").pathname;
}

export function useParams<T extends Params = Params>(): T {
  const params: Params = useRouterParams({ strict: false });
  return params as T;
}

export function useSearchParams(): URLSearchParams {
  const router = useTanStackRouter();
  const search = useLocation({ select: () => router.history.location.search });
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function usePathname(): string {
  return useLocation({ select: (location) => getPathnameFromHref(location.publicHref) });
}

export function useRouter() {
  const router = useTanStackRouter();

  return useMemo(
    () => ({
      push: (href: string, options?: NavigateOptions) =>
        router.navigate<RegisteredRouter, string>({ href, resetScroll: options?.scroll ?? true }),
      replace: (href: string, options?: NavigateOptions) =>
        router.navigate<RegisteredRouter, string>({
          href,
          replace: true,
          resetScroll: options?.scroll ?? true,
        }),
      prefetch: (href: string) => router.preloadRoute<string, string>({ href }),
    }),
    [router],
  );
}
