import { Suspense } from "react";

import Header from "@/containers/header";
import FeedbackButton from "@/containers/report/feedback";
import ThirdParty from "@/containers/third-party";

export default async function ReportLayoutReportId({
  children,
}: LayoutProps<"/[locale]/[country]/reports/[id]">) {
  return (
    <Suspense fallback={null}>
      <Header />
      <FeedbackButton />

      <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
        {children}
      </main>
      <ThirdParty />
    </Suspense>
  );
}
