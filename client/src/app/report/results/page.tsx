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

import WidgetsBioeconomicAndResearchData from "@/containers/widgets/bioeconomy-and-research";
import WidgetsDemographicAndSocieconomic from "@/containers/widgets/demographic-and-socioeconomic";
import WidgetsLandCover from "@/containers/widgets/land-cover";
import WidgetsOverview from "@/containers/widgets/overview";

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
      <main className="relative flex flex-col bg-blue-50 py-12 space-y-10">
        <header>
          <div className="container">
            <div className="max-w-2xl mx-auto space-y-4">
              <h1 className="text-3xl font-bold text-blue-500 text-center">
                Testing
              </h1>
            </div>
          </div>
        </header>
        <div className="flex flex-col space-y-20">
          {/* OVERVIEW */}
          <WidgetsOverview />

          {/* DEMOGRAPHIC AND SOCIOECONOMIC */}
          <WidgetsDemographicAndSocieconomic />

          {/* BIOECONOMY */}
          <WidgetsBioeconomicAndResearchData />

          {/* LAND COVER */}
          <WidgetsLandCover />
        </div>
      </main>
    </HydrationBoundary>
  );
}
