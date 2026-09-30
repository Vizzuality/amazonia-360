import { Metadata } from "next";

import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

import Footer from "@/containers/footer";
import CountryModulePartnerships from "@/containers/partners/country-modules";
import PartnersHero from "@/containers/partners/hero";
import OtherPartners from "@/containers/partners/other";

type Params = Promise<{ locale: Locale }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-partners-page-title"),
    description: t("metadata-partners-page-description"),
  };
}

export default function PartnersPage() {
  return (
    <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
      <PartnersHero />
      <CountryModulePartnerships />
      <OtherPartners />
      <Footer />
    </main>
  );
}
