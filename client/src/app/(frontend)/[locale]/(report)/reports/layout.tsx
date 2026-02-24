import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ReportMap from "@/containers/report/map";
import ThirdParty from "@/containers/third-party";

import { routing } from "@/i18n/routing";

import E2EBridge from "@/components/e2e-bridge";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({
    locale,
  }));
}

export default async function ReportNewLayout({ children }: LayoutProps<"/[locale]/reports">) {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <FeedbackButton />
        <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
          {children}
          <ReportMap />
        </main>
        <ThirdParty />
        {process.env.NEXT_PUBLIC_E2E_BRIDGE === "true" && <E2EBridge />}
      </Suspense>
    </JotaiProvider>
  );
}
