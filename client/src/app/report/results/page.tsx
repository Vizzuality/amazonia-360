import { Metadata } from "next";

import { redirect } from "next/navigation";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";

import { getSearchQueryOptions } from "@/lib/search";

import { locationParser } from "@/app/parsers";
import { PageProps } from "@/app/types";

import DataDisclaimer from "@/containers/disclaimers/data";
import TopicsSidebar from "@/containers/report/indicators/sidebar";
import ReportResultsContent from "@/containers/report/results/content";
import ReportResultsHeader from "@/containers/report/results/header";

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

  if (l && l.type === "search") {
    const { queryKey, queryFn } = getSearchQueryOptions(l);

    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="relative bg-blue-50 pb-12 print:bg-white">
        <SidebarProvider>
          <div className="w-full flex-col">
            <ReportResultsHeader />
            <ReportResultsContent />
          </div>
          <div className="relative">
            <TopicsSidebar />
          </div>
        </SidebarProvider>
      </main>
      <DataDisclaimer />
    </HydrationBoundary>
  );
}
