import { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import PageProviders from "@/app/[locale]/report/page-providers";

import ReportLocation from "@/containers/report/location";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-report-page-title"),
    description: t("metadata-report-page-description"),
  };
}

export default function ReportPage() {
  return (
    <PageProviders>
      <main className="relative flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
        <ReportLocation />
      </main>
    </PageProviders>
  );
}
