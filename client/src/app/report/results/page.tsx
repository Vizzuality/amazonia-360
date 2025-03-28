import { Metadata } from "next";

import { redirect } from "next/navigation";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

// import { getSearchQueryOptions } from "@/lib/search";

import { locationParser } from "@/app/parsers";
import { PageProps } from "@/app/types";

import DataDisclaimer from "@/containers/disclaimers/data";
import ReportSidebar from "@/containers/report/sidebar";
import ReportResultsContent from "@/containers/results/content";
import ReportResultsHeader from "@/containers/results/header";

import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Report | results",
  description: "Report results description",
};

// Define the types for the page parameters
export interface Params {}

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

  // if (l && l.type === "search") {
  //   const { queryKey, queryFn } = getSearchQueryOptions(l);

  //   await queryClient.prefetchQuery({
  //     queryKey,
  //     queryFn,
  //   });
  // }

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
