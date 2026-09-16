import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";
import { Locale } from "next-intl";

import { requireUser } from "@/lib/auth/require-user";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ReportMap from "@/containers/report/map";
import ThirdParty from "@/containers/third-party";

import E2EBridge from "@/components/e2e-bridge";

export const dynamic = "force-dynamic";

export default async function ReportNewLayout({
  children,
  params,
}: LayoutProps<"/[locale]/reports">) {
  const { locale } = await params;
  await requireUser(locale as Locale);

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
