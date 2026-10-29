import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Provider as JotaiProvider } from "jotai";

import { requireUserBeforeLoad } from "@/lib/auth/gates";

import CountryModule from "@/containers/country-module";
import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ReportMap from "@/containers/report/map";
import ThirdParty from "@/containers/third-party";

import E2EBridge from "@/components/e2e-bridge";

export const Route = createFileRoute("/$locale/{-$country}/reports")({
  beforeLoad: requireUserBeforeLoad,
  component: ReportNewLayout,
});

function ReportNewLayout() {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <CountryModule />
        <FeedbackButton />
        <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
          <Outlet />
          <ReportMap />
        </main>
        <ThirdParty />
        {import.meta.env.VITE_E2E_BRIDGE === "true" && <E2EBridge />}
      </Suspense>
    </JotaiProvider>
  );
}
