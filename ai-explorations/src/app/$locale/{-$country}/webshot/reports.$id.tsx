import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta } from "@/lib/metadata";
import { notFound } from "@/lib/navigation";
import { reportPageQueryOptions } from "@/lib/report";

import Pdf from "@/containers/webshot/pdf-report";

import CustomReport404 from "../-components/custom-report-404";

const METADATA = {
  title: "Report - Amazonia 360",
  description: "Generate a PDF report of your current map view.",
};

export const Route = createFileRoute("/$locale/{-$country}/webshot/reports/$id")({
  loader: async ({ params: { id }, context: { locale, queryClient } }) => {
    await queryClient
      .ensureQueryData(reportPageQueryOptions({ id, locale }))
      .catch(() => notFound());
  },
  head: () => ({ meta: getHeadMeta(METADATA) }),
  component: WebshotReport,
  notFoundComponent: CustomReport404,
});

function WebshotReport() {
  return (
    <main className="relative bg-gray-500">
      <Pdf />
    </main>
  );
}
