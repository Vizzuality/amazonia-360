import { Metadata } from "next";

import { redirect } from "next/navigation";

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
} from "@tanstack/react-query";

import { getSearchQueryOptions } from "@/lib/search";

import { locationParser } from "@/app/parsers";
import { PageProps } from "@/app/types";

import ReportResultsContent from "@/containers/report/results/content";
import ReportResultsHeader from "@/containers/report/results/header";

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

export default async function ReportResultsPage({
  searchParams,
}: PageProps<Params, SearchParams>) {
  if (!searchParams.location || !searchParams.topics) {
    redirect("/report");
  }

  const queryClient = new QueryClient();
  const l = locationParser.parseServerSide(searchParams.location);

  if (l && l.type === "search") {
    const { queryKey, queryFn } = getSearchQueryOptions(l);

    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="relative flex flex-col print:bg-white bg-blue-50 py-12 min-h-[calc(100svh_-_theme(space.40)_+_1px)]">
        <ReportResultsHeader />

        <ReportResultsContent />
      </main>
    </HydrationBoundary>
  );
}
