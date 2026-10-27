import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Provider as JotaiProvider } from "jotai";

import { requireUserBelowIndexBeforeLoad } from "@/lib/auth/gates";

export const Route = createFileRoute("/$locale/{-$country}/webshot")({
  beforeLoad: requireUserBelowIndexBeforeLoad,
  component: WebshotLayout,
});

function WebshotLayout() {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </JotaiProvider>
  );
}
