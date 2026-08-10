import { Suspense } from "react";

import { Metadata } from "next";

import { notFound } from "next/navigation";

import { getPayload } from "payload";

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import { reportQueryOptions } from "@/lib/report";

import Footer from "@/containers/footer";
import { ReportResults } from "@/containers/results";

import config from "@/payload.config";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reports/[id]">): Promise<Metadata> {
  const { id, locale } = await params;

  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: `${t("metadata-report-page-title")} - ${id}`,
    description: t("metadata-report-page-description"),
  };
}

export default async function ReportResultsPage({ params }: PageProps<"/[locale]/reports/[id]">) {
  const { id, locale } = await params;

  const payload = await getPayload({ config });

  const report = await payload
    .findByID({
      collection: "reports",
      id,
      locale: locale as Locale,
    })
    .catch(() => notFound());

  const queryClient = new QueryClient();
  queryClient.setQueryData(reportQueryOptions({ id, locale: locale as Locale }).queryKey, report);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <ReportResults />
      </Suspense>
      <Footer />
    </HydrationBoundary>
  );
}
