import { Metadata } from "next";

import { QueryClient } from "@tanstack/react-query";

import { getSearchQueryOptions } from "@/lib/search";

import { locationParser } from "@/app/parsers";
import { PageProps } from "@/app/types";

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
    <div className="relative flex flex-col bg-blue-50 py-12 min-h-[calc(100svh_-_theme(space.40)_+_1px)]">
      Esto es un pdf
    </div>
  );
}
