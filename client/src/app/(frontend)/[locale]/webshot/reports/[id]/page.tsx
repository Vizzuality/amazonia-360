import Head from "next/head";
import { notFound } from "next/navigation";

import { getPayload } from "payload";

import { QueryClient } from "@tanstack/react-query";
import { Locale } from "next-intl";

import { reportQueryOptions } from "@/lib/report";

import Pdf from "@/containers/webshot/pdf-report";

import config from "@/payload.config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Report - Amazonia 360",
  description: "Generate a PDF report of your current map view.",
};

export default async function WebshotReport({
  params,
}: PageProps<"/[locale]/webshot/reports/[id]">) {
  const queryClient = new QueryClient();

  const { id, locale } = await params;

  const payload = await getPayload({ config });
  try {
    await payload.findByID({
      collection: "reports",
      id,
    });
  } catch (_error) {
    notFound();
  }

  await queryClient.prefetchQuery(reportQueryOptions({ id, locale: locale as Locale }));

  return (
    <>
      <Head>
        <meta name="viewport" content="width=1920px, initial-scale=1" />
      </Head>

      <main className="relative bg-gray-500">
        <Pdf />
      </main>
    </>
  );
}
