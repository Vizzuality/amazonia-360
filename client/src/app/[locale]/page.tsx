import { getTranslations } from "next-intl/server";

import Footer from "@/containers/footer";
import About from "@/containers/home/about";
import Glance from "@/containers/home/glance";
import Help from "@/containers/home/help";
import Hero from "@/containers/home/hero";
import Hub from "@/containers/home/hub";
import InformationOn from "@/containers/home/information-on";
import KeyFeaturesGrid from "@/containers/home/key-features-grid";
import KeyFeaturesReport from "@/containers/home/key-features-report";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-home-page-title"),
    description: t("metadata-home-page-description"),
  };
}

export default function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <Hero />
      <About />
      <KeyFeaturesReport />
      <KeyFeaturesGrid />
      <InformationOn />
      <Glance />
      <Hub />
      <Help />
      <Footer />
    </main>
  );
}
