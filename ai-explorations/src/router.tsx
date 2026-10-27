import { createRouter } from "@tanstack/react-router";

import { payloadParseSearch, payloadStringifySearch } from "@payloadcms/tanstack-start/shared";

import { QueryClient } from "@tanstack/react-query";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

function DefaultNotFound() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>404 — Page not found</h1>
      <p>The page you requested does not exist.</p>
    </div>
  );
}

function getQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
}

export function getRouter() {
  const queryClient = getQueryClient();

  const router = createRouter({
    caseSensitive: true,
    context: { queryClient },
    defaultNotFoundComponent: DefaultNotFound,
    parseSearch: payloadParseSearch,
    routeTree,
    scrollRestoration: true,
    stringifySearch: payloadStringifySearch,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
