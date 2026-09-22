import { useState } from "react";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  PathParamsContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider as JotaiProvider, type WritableAtom } from "jotai";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { vi } from "vitest";
import { render } from "vitest-browser-react";

import { MediaContextProvider } from "@/containers/media";
import { ArcGISProvider } from "@/containers/providers/arcgis";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { routing } from "@/i18n/routing";
import en from "@/i18n/translations/en.json";
import es from "@/i18n/translations/es.json";
import pt from "@/i18n/translations/pt.json";

import type { TestSession } from "../fixtures/session";

export type TestLocale = (typeof routing.locales)[number];

export interface RenderWithProvidersOptions {
  locale?: TestLocale;
  queryClient?: QueryClient;
  pathname?: string;
  searchParams?: URLSearchParams;
  initialAtoms?: Array<[unknown, unknown]>;
  session?: TestSession | null;
  params?: Record<string, string | string[]>;
}

const MESSAGES: Record<TestLocale, Record<string, unknown>> = { en, es, pt };

function TestSearchParamsProvider({
  initialSearchParams,
  children,
}: Readonly<{
  initialSearchParams: URLSearchParams;
  children: React.ReactNode;
}>) {
  const [searchParams, setSearchParams] = useState(initialSearchParams);

  return (
    <SearchParamsContext.Provider value={searchParams}>
      <NuqsTestingAdapter
        searchParams={initialSearchParams}
        onUrlUpdate={({ searchParams: next }) => setSearchParams(new URLSearchParams(next))}
      >
        {children}
      </NuqsTestingAdapter>
    </SearchParamsContext.Provider>
  );
}

function getTestRouter(): AppRouterInstance {
  return {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    bfcacheId: "_b_0_",
  };
}

/**
 * Renders `ui` under every provider the app mounts in `app/(frontend)/layout-providers.tsx`
 * and `app/(frontend)/[locale]/layout.tsx`, plus a Jotai store scoped to this render and
 * stubs for the App Router contexts Next would otherwise supply.
 *
 * The providers are passed as `render`'s `wrapper`, so `screen.rerender(ui)` keeps them.
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
    params = {},
  } = options;

  const messages = MESSAGES[locale];
  const router = getTestRouter();
  const store = createStore();

  for (const [atom, value] of initialAtoms) {
    store.set(atom as WritableAtom<unknown, [unknown], unknown>, value);
  }

  const pathParams = { locale, ...params };

  function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
      <AppRouterContext.Provider value={router}>
        <PathnameContext.Provider value={pathname}>
          <TestSearchParamsProvider initialSearchParams={searchParams}>
            <PathParamsContext.Provider value={pathParams}>
              <SessionProvider session={session} basePath="/local-api/auth">
                <MediaContextProvider>
                  <QueryClientProvider client={queryClient}>
                    <ArcGISProvider locale={locale}>
                      <TooltipProvider>
                        <JotaiProvider store={store}>
                          <NextIntlClientProvider locale={locale} messages={messages}>
                            <SidebarProvider>{children}</SidebarProvider>
                          </NextIntlClientProvider>
                        </JotaiProvider>
                      </TooltipProvider>
                    </ArcGISProvider>
                  </QueryClientProvider>
                </MediaContextProvider>
              </SessionProvider>
            </PathParamsContext.Provider>
          </TestSearchParamsProvider>
        </PathnameContext.Provider>
      </AppRouterContext.Provider>
    );
  }

  const screen = await render(ui, { wrapper: Providers });

  return { screen, router };
}
