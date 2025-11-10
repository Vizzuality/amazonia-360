"use client";

import useIsMounted from "@/lib/mounted";

import ReportResultsLoading from "@/app/(frontend)/[locale]/(app)/report/(results)/results/[id]/loading";

import ReportResultsHeader from "@/containers/header/results";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsSidebar from "@/containers/results/sidebar";

export const ReportResults = () => {
  const isMounted = useIsMounted();

  if (!isMounted()) {
    return <ReportResultsLoading />;
  }

  return (
    <main className="relative flex bg-blue-50 pb-5 print:w-full print:bg-white print:p-0">
      <div className="w-full flex-col print:w-full">
        <ReportResultsHeader />
        <ReportResultsContent />
      </div>
      <div className="relative print:hidden">
        <ReportResultsSidebar />
      </div>
    </main>
  );
};
