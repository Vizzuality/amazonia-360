import { Suspense } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";
import { notFound } from "@/lib/navigation";
import { reportPageQueryOptions } from "@/lib/report";

import Footer from "@/containers/footer";
import { ReportResults } from "@/containers/results";

import CustomReport404 from "../-components/custom-report-404";
import ReportResultsLoading from "../-components/report-results-loading";

export const Route = createFileRoute("/$locale/{-$country}/_reportId/reports/$id")({
  loader: async ({ params: { id }, context: { locale, queryClient } }) => {
    await queryClient
      .ensureQueryData(reportPageQueryOptions({ id, locale }))
      .catch(() => notFound());

    return getPageMetadata(locale, "report-page");
  },
  head: ({ params: { id }, loaderData }) => ({
    meta: getHeadMeta(loaderData && { ...loaderData, title: `${loaderData.title} - ${id}` }),
  }),
  component: ReportResultsPage,
  pendingComponent: ReportResultsLoading,
  notFoundComponent: CustomReport404,
});

function ReportResultsPage() {
  return (
    <>
      <Suspense>
        <ReportResults />
      </Suspense>
      <Footer />
    </>
  );
}
