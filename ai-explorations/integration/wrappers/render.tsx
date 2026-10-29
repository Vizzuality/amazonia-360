import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { payloadParseSearch, payloadStringifySearch } from "@payloadcms/tanstack-start/shared";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider as JotaiProvider, type WritableAtom } from "jotai";
import { IntlProvider, type Messages } from "use-intl";
import { render } from "vitest-browser-react";

import { SessionProvider } from "@/lib/auth/react";
import {
  getCountryModulesQueryOptions,
  getPartnersQueryOptions,
  type CountryModule,
  type Partner,
} from "@/lib/country-modules";

import { MediaContextProvider } from "@/containers/media";
import { ArcGISProvider } from "@/containers/providers/arcgis";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { routing } from "@/i18n/routing";
import en from "@/i18n/translations/en.json";
import es from "@/i18n/translations/es.json";
import pt from "@/i18n/translations/pt.json";

import { ECU_MODULE } from "../fixtures/country-modules";
import type { TestSession } from "../fixtures/session";

export type TestLocale = (typeof routing.locales)[number];

export interface RenderWithProvidersOptions {
  locale?: TestLocale;
  queryClient?: QueryClient;
  pathname?: string;
  searchParams?: URLSearchParams;
  initialAtoms?: Array<[unknown, unknown]>;
  session?: TestSession | null;
  countryModules?: CountryModule[];
  partners?: Partner[];
}

const MESSAGES: Record<TestLocale, Messages> = { en, es, pt };

function getInitialEntry(pathname: string, searchParams: URLSearchParams): string {
  const search = searchParams.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function getTestRouter(ui: React.ReactNode, queryClient: QueryClient, initialEntry: string) {
  function TestOutlet() {
    return ui;
  }

  const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()();
  const localeRoute = createRoute({ getParentRoute: () => rootRoute, path: "$locale" });
  const countryRoute = createRoute({ getParentRoute: () => localeRoute, path: "{-$country}" });
  const routeTree = rootRoute.addChildren([
    localeRoute.addChildren([
      countryRoute.addChildren([
        createRoute({ getParentRoute: () => countryRoute, path: "/", component: TestOutlet }),
        createRoute({
          getParentRoute: () => countryRoute,
          path: "reports/$id",
          component: TestOutlet,
        }),
        createRoute({ getParentRoute: () => countryRoute, path: "$", component: TestOutlet }),
      ]),
    ]),
  ]);

  return createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    parseSearch: payloadParseSearch,
    stringifySearch: payloadStringifySearch,
  });
}

/**
 * Mounts `ui` as the matched route of a memory-history TanStack Router, under the providers
 * `app/$locale/route.tsx` supplies plus a Jotai store scoped to this render. Route params
 * (`locale`, `country`, `id` for `/reports/$id`) come from `pathname`, as they do in the app.
 */
export async function renderWithProviders(
  ui: React.ReactNode,
  options: RenderWithProvidersOptions = {},
) {
  const {
    locale = routing.defaultLocale,
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
    pathname = `/${locale}`,
    searchParams = new URLSearchParams(),
    initialAtoms = [],
    session = null,
    countryModules = [ECU_MODULE],
    partners = [],
  } = options;

  queryClient.setQueryData(getCountryModulesQueryOptions(locale).queryKey, countryModules);
  queryClient.setQueryData(getPartnersQueryOptions(locale).queryKey, partners);

  const store = createStore();

  for (const [atom, value] of initialAtoms) {
    store.set(atom as WritableAtom<unknown, [unknown], unknown>, value);
  }

  const router = getTestRouter(ui, queryClient, getInitialEntry(pathname, searchParams));
  await router.load();

  const screen = await render(
    <QueryClientProvider client={queryClient}>
      <JotaiProvider store={store}>
        <SessionProvider session={session}>
          <MediaContextProvider>
            <ArcGISProvider locale={locale}>
              <TooltipProvider>
                <SidebarProvider>
                  <IntlProvider locale={locale} messages={MESSAGES[locale]} timeZone="UTC">
                    <RouterProvider router={router} />
                  </IntlProvider>
                </SidebarProvider>
              </TooltipProvider>
            </ArcGISProvider>
          </MediaContextProvider>
        </SessionProvider>
      </JotaiProvider>
    </QueryClientProvider>,
  );

  return { screen, queryClient, router, store };
}
