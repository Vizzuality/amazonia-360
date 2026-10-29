import { createIsomorphicFn } from "@tanstack/react-start";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import arcgisCss from "@arcgis/core/assets/esri/themes/light/main.css?url";
import mdxEditorCss from "@mdxeditor/editor/style.css?url";
import { QueryClient } from "@tanstack/react-query";
import reactResizableCss from "react-resizable/css/styles.css?url";
import { Toaster } from "sonner";
import { createTranslator, hasLocale, IntlProvider, Locale, Messages } from "use-intl";

import { SessionProvider, getSessionQueryOptions } from "@/lib/auth/react";
import { getCountryModulesQueryOptions, getPartnersQueryOptions } from "@/lib/country-modules";
import { getServerTimeZoneFn } from "@/lib/locale-layout.functions";
import { notFound } from "@/lib/navigation";
import { NavigationGuardProvider } from "@/lib/navigation-guard";
import { getUrlStateSearch } from "@/lib/url-state/search-state";

import { MediaContextProvider } from "@/containers/media";
import { ArcGISProvider } from "@/containers/providers/arcgis";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { getMessages } from "@/i18n/request";
import { routing } from "@/i18n/routing";
import fontsCss from "@/styles/fonts.css?url";
import globalsCss from "@/styles/globals.css?url";
import gridLayoutCss from "@/styles/grid-layout.css?url";

const STYLESHEETS = [
  fontsCss,
  arcgisCss,
  mdxEditorCss,
  globalsCss,
  gridLayoutCss,
  reactResizableCss,
];

const ICONS = [
  { rel: "icon", href: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
  { rel: "icon", href: "/icon.png", type: "image/png" },
  { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
  { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "icon", href: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
  { rel: "icon", href: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
  { rel: "manifest", href: "/manifest.webmanifest" },
];

function getLayoutMeta(locale: Locale, messages: Messages | undefined) {
  if (!messages) return [];
  const t = createTranslator({ locale, messages });

  return [
    { title: t("metadata-app-layout-title") },
    { name: "description", content: t("metadata-app-layout-description") },
    { name: "google-site-verification", content: "4kLfup1Xp504REXNWUYnh6iRRYfWHzqILrIcgK00E9E" },
  ];
}

// In `beforeLoad`, not the loader: `{-$country}`'s `beforeLoad` reads the modules before any loader runs.
const prefetchCountryModules = createIsomorphicFn()
  .server(async (queryClient: QueryClient, locale: Locale) => {
    const { prefetchCountryModules: prefetch } = await import("@/lib/country-modules/prefetch");
    await prefetch(queryClient, locale);
  })
  .client(() => Promise.resolve());

function getNotFoundMeta(matches: readonly { status: string; globalNotFound?: boolean }[]) {
  const isNotFound = matches.some((match) => match.status === "notFound" || match.globalNotFound);
  return isNotFound ? [{ name: "robots", content: "noindex" }] : [];
}

export const Route = createFileRoute("/$locale")({
  validateSearch: getUrlStateSearch,
  beforeLoad: async ({ params, context: { queryClient } }) => {
    if (!hasLocale(routing.locales, params.locale)) notFound();
    await prefetchCountryModules(queryClient, params.locale);
    return { locale: params.locale };
  },
  loader: async ({ context: { locale, queryClient } }) => {
    const [messages, timeZone] = await Promise.all([
      getMessages(locale),
      getServerTimeZoneFn(),
      queryClient.ensureQueryData(getCountryModulesQueryOptions(locale)),
      queryClient.ensureQueryData(getPartnersQueryOptions(locale)),
      queryClient.ensureQueryData(getSessionQueryOptions()),
    ]);

    return { messages, timeZone };
  },
  staleTime: Infinity,
  head: ({ params, loaderData, matches }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...getLayoutMeta(params.locale as Locale, loaderData?.messages),
      ...getNotFoundMeta(matches),
    ],
    links: [...STYLESHEETS.map((href) => ({ rel: "stylesheet", href })), ...ICONS],
  }),
  component: LocaleLayout,
});

function LocaleLayout() {
  const { locale } = Route.useRouteContext();
  const { messages, timeZone } = Route.useLoaderData();

  return (
    <SessionProvider>
      <MediaContextProvider>
        <ArcGISProvider locale={locale}>
          <NavigationGuardProvider>
            <TooltipProvider>
              <Toaster position="top-center" richColors />
              <SidebarProvider>
                <IntlProvider locale={locale} messages={messages} timeZone={timeZone}>
                  <Outlet />
                </IntlProvider>
              </SidebarProvider>
            </TooltipProvider>
          </NavigationGuardProvider>
        </ArcGISProvider>
      </MediaContextProvider>
    </SessionProvider>
  );
}
