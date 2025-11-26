import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ReportGrid from "@/containers/report/grid";

type Params = Promise<{ locale: Locale }>;

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

  return <ReportGrid />;
}
