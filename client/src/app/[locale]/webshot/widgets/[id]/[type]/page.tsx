import { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import Hero from "@/containers/home/hero";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return {
    title: t("metadata-home-page-title"),
    description: t("metadata-home-page-description"),
  };
}

export default function WebshotWidgets() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <Hero />
    </main>
  );
}
