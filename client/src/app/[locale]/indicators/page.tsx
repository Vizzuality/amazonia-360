import { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import PageProviders from "@/app/[locale]/report/page-providers";

import Indicators from "@/containers/indicators";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-indicators-page-title"),
    description: t("metadata-indicators-page-description"),
  };
}

export default function IndicatorsPage() {
  return (
    <PageProviders>
      <Indicators />
    </PageProviders>
  );
}
