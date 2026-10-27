import { createFileRoute } from "@tanstack/react-router";

import { isFeatureEnabled } from "@/lib/feature-flags";
import { getHeadMeta, getPageMetadata } from "@/lib/metadata";
import { notFound } from "@/lib/navigation";

import Footer from "@/containers/footer";
import CountryModulePartnerships from "@/containers/partners/country-modules";
import PartnersHero from "@/containers/partners/hero";
import OtherPartners from "@/containers/partners/other";

import Custom500 from "../-components/custom-500";

export const Route = createFileRoute("/$locale/{-$country}/_app/partners")({
  beforeLoad: () => {
    if (!isFeatureEnabled("country-module")) notFound();
  },
  loader: ({ context: { locale } }) => getPageMetadata(locale, "partners-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: PartnersPage,
  errorComponent: Custom500,
});

function PartnersPage() {
  return (
    <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
      <PartnersHero />
      <CountryModulePartnerships />
      <OtherPartners />
      <Footer showDisclaimer={false} />
    </main>
  );
}
