import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import ReportIndicators from "@/containers/report/indicators";

export const Route = createFileRoute("/$locale/{-$country}/reports/indicators")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "report-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: ReportPage,
});

function ReportPage() {
  return <ReportIndicators />;
}
