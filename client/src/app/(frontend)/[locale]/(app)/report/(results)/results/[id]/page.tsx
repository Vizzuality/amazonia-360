import { Metadata } from "next";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { reportQueryOptions } from "@/lib/report";

import DataDisclaimer from "@/containers/disclaimers/data";
import { LoadProvider } from "@/containers/indicators/load-provider";
import { ReportResults } from "@/containers/results";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-report-results-page-title"),
    description: t("metadata-report-results-page-description"),
  };
}

export default async function ReportResultsPage({
  params,
}: PageProps<"/[locale]/report/results/[id]">) {
  const queryClient = new QueryClient();

  const { id } = await params;

  await queryClient.prefetchQuery(reportQueryOptions({ id: Number(id) }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LoadProvider>
        <ReportResults />
        <DataDisclaimer />
      </LoadProvider>
    </HydrationBoundary>
  );
}
