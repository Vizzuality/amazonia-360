import { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import PageProviders from "@/app/[locale]/report/page-providers";

import Footer from "@/containers/footer";
import Hub from "@/containers/hub";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-hub-page-title"),
    description: t("metadata-hub-page-description"),
  };
}

export default function HubPage() {
  return (
    <PageProviders>
      <Hub />
      <Footer />
    </PageProviders>
  );
}
