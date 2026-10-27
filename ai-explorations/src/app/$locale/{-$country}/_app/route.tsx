import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Provider as JotaiProvider } from "jotai";

import Header from "@/containers/header";
import ThirdParty from "@/containers/third-party";

export const Route = createFileRoute("/$locale/{-$country}/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <Outlet />
        <ThirdParty />
      </Suspense>
    </JotaiProvider>
  );
}
