import { Suspense } from "react";

import { Provider as JotaiProvider } from "jotai";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ThirdParty from "@/containers/third-party";

export default async function ReportLayoutReportId({
  children,
}: LayoutProps<"/[locale]/reports/[id]">) {
  return (
    <JotaiProvider>
      <Suspense fallback={null}>
        <Header />
        <FeedbackButton />

        <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
          {children}
        </main>
        <ThirdParty />
      </Suspense>
    </JotaiProvider>
  );
}
