import { Metadata } from "next";

import { getTranslations, setRequestLocale } from "next-intl/server";

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

export default async function HubPage({ params }: { params: Params }) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  return (
    <>
      <Hub />
      <Footer />
    </>
  );
}
