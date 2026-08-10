import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";
import { Locale } from "next-intl";

import { requireUser } from "@/lib/auth/require-user";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ThirdParty from "@/containers/third-party";

export const dynamic = "force-dynamic";

export default async function ReportLayoutReportId({
  children,
  params,
}: LayoutProps<"/[locale]/reports/[id]">) {
  const { locale } = await params;
  await requireUser(locale as Locale);

  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <FeedbackButton />

        <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
          {children}
        </main>
        <ThirdParty />
      </Suspense>
    </JotaiProvider>
  );
}
