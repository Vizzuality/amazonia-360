import { notFound } from "next/navigation";

import { getPayload } from "payload";

import { QueryClient } from "@tanstack/react-query";

import { reportQueryOptions } from "@/lib/report";

import Pdf from "@/containers/webshot/pdf-report";

import config from "@/payload.config";

export const metadata = {
  title: "Report - Amazonia 360",
  description: "Generate a PDF report of your current map view.",
};

export default async function WebshotReport({
  params,
}: PageProps<"/[locale]/webshot/report/[id]">) {
  const queryClient = new QueryClient();

  const { id } = await params;

  const payload = await getPayload({ config });
  try {
    await payload.findByID({
      collection: "reports",
      id: Number(id),
    });
  } catch (_error) {
    notFound();
  }

  await queryClient.prefetchQuery(reportQueryOptions({ id: Number(id) }));

  return (
    <>
      <head>
        <meta name="viewport" content="width=1920px, initial-scale=1" />
      </head>

      <main className="relative bg-gray-500">
        <Pdf />
      </main>
    </>
  );
}
