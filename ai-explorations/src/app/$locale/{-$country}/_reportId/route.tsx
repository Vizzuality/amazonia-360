import { Suspense } from "react";

import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Provider as JotaiProvider } from "jotai";

import { requireUserBeforeLoad } from "@/lib/auth/gates";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ThirdParty from "@/containers/third-party";

export const Route = createFileRoute("/$locale/{-$country}/_reportId")({
  beforeLoad: requireUserBeforeLoad,
  component: ReportLayoutReportId,
});

function ReportLayoutReportId() {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <FeedbackButton />

        <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
          <Outlet />
        </main>
        <ThirdParty />
      </Suspense>
    </JotaiProvider>
  );
}
