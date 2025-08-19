import { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

import PageProviders from "@/app/[locale]/(app)/report/page-providers";

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

export default async function ReportPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <PageProviders>
      <main className="relative flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
        <ReportLocation />
      </main>
    </PageProviders>
  );
}
