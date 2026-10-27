import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import ReportGrid from "@/containers/report/grid";

export const Route = createFileRoute("/$locale/{-$country}/reports/grid")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "report-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: ReportPage,
});

function ReportPage() {
  return <ReportGrid />;
}
