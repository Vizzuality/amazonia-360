import { Metadata } from "next";

import { redirect } from "next/navigation";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";

// import { getSearchQueryOptions } from "@/lib/search";

import { locationParser } from "@/app/parsers";
import { PageProps } from "@/app/types";

import DataDisclaimer from "@/containers/disclaimers/data";
import ReportSidebar from "@/containers/report/sidebar";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsHeader from "@/containers/results/header";

import { SidebarProvider } from "@/components/ui/sidebar";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-report-results-page-title"),
    description: t("metadata-report-results-page-description"),
  };
}

export interface SearchParams {
  location: string;
  topics: string;
}

export default async function ReportResultsPage({ searchParams }: PageProps<Params, SearchParams>) {
  const queryClient = new QueryClient();
  const l = locationParser.parseServerSide((await searchParams).location);

  if (!l) {
    redirect("/report");
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="relative bg-blue-50 pb-5 print:w-full print:bg-white print:p-0">
        <SidebarProvider>
          <div className="w-full flex-col print:w-full">
            <ReportResultsHeader />
            <ReportResultsContent />
          </div>
          <div className="relative print:hidden">
            <ReportSidebar />
          </div>
        </SidebarProvider>
      </main>
      <DataDisclaimer />
    </HydrationBoundary>
  );
}
