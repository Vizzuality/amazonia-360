import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import ReportLocation from "@/containers/report/location";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reports">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale });

  return {
    title: t("metadata-report-page-title"),
    description: t("metadata-report-page-description"),
  };
}

export default async function ReportPage(_props: PageProps<"/[locale]/reports">) {
  return <ReportLocation />;
}
