"use client";

import { useState } from "react";

import { QueryClient, QueryClientProvider } from "react-query";

import { MapProvider } from "@/components/map/provider";

export default function LayoutProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnReconnect: false,
            refetchOnWindowFocus: false,
            keepPreviousData: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MapProvider>{children}</MapProvider>
    </QueryClientProvider>
  );
}
