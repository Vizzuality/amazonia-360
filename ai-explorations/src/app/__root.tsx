import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";

import { withPayloadRoot } from "@payloadcms/tanstack-start/client";

import type { QueryClient } from "@tanstack/react-query";
import { hasLocale } from "use-intl";

import { mediaStyles } from "@/containers/media";

import { routing } from "@/i18n/routing";

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  shellComponent: withPayloadRoot(FrontendRoot),
});

function getDocumentLocale(pathname: string): string {
  const segment = pathname.split("/")[1];
  return hasLocale(routing.locales, segment) ? segment : routing.defaultLocale;
}

function FrontendRoot({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = useRouterState({ select: (state) => getDocumentLocale(state.location.pathname) });

  return (
    <html lang={locale}>
      <head>
        <HeadContent />
        <style
          key="fresnel-css"
          dangerouslySetInnerHTML={{ __html: mediaStyles }}
          type="text/css"
        />
      </head>
      <body className="montserrat w-full overflow-x-hidden">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
