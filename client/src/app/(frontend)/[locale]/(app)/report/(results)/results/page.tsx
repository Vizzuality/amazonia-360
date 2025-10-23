import { Metadata } from "next";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

// import { getSearchQueryOptions } from "@/lib/search";

import DataDisclaimer from "@/containers/disclaimers/data";
import ReportResultsHeader from "@/containers/header/results";
import { LoadProvider } from "@/containers/indicators/load-provider";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsSidebar from "@/containers/results/sidebar";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-report-results-page-title"),
    description: t("metadata-report-results-page-description"),
  };
}

export default async function ReportResultsPage() {
  const queryClient = new QueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LoadProvider>
        <main className="relative flex bg-blue-50 pb-5 print:w-full print:bg-white print:p-0">
          <div className="w-full flex-col print:w-full">
            <ReportResultsHeader />
            <ReportResultsContent />
          </div>
          <div className="relative print:hidden">
            <ReportResultsSidebar />
          </div>
        </main>
        <DataDisclaimer />
      </LoadProvider>
    </HydrationBoundary>
  );
}
