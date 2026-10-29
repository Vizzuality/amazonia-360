import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import ReportLocation from "@/containers/report/location";

export const Route = createFileRoute("/$locale/{-$country}/reports/")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "report-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: ReportPage,
});

function ReportPage() {
  return <ReportLocation />;
}
