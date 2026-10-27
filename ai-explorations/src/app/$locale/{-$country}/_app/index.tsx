import { createFileRoute } from "@tanstack/react-router";

import { getHeadMeta, getPageMetadata } from "@/lib/metadata";

import Footer from "@/containers/footer";
import About from "@/containers/home/about";
import CountryModules from "@/containers/home/country-modules";
import Glance from "@/containers/home/glance";
import Help from "@/containers/home/help";
import Hero from "@/containers/home/hero";
import Hub from "@/containers/home/hub";
import InformationOn from "@/containers/home/information-on";
import KeyFeaturesGrid from "@/containers/home/key-features-grid";
import KeyFeaturesReport from "@/containers/home/key-features-report";
import Partners from "@/containers/home/partners";

import Custom500 from "../-components/custom-500";

export const Route = createFileRoute("/$locale/{-$country}/_app/")({
  loader: ({ context: { locale } }) => getPageMetadata(locale, "home-page"),
  head: ({ loaderData }) => ({ meta: getHeadMeta(loaderData) }),
  component: HomePage,
  errorComponent: Custom500,
});

function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100svh-calc(var(--spacing)*16))] flex-col">
      <Hero />
      <About />
      <KeyFeaturesReport />
      <KeyFeaturesGrid />
      <InformationOn />
      <CountryModules />
      <Glance />
      <Partners />
      <Hub />
      <Help />
      <Footer />
    </main>
  );
}
