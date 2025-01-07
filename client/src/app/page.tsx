import { Metadata } from "next";

import Footer from "@/containers/footer";
import About from "@/containers/home/about";
import Glance from "@/containers/home/glance";
import Help from "@/containers/home/help";
import Hero from "@/containers/home/hero";
import Hub from "@/containers/home/hub";
import InformationOn from "@/containers/home/information-on";
import KeyFeaturesGrid from "@/containers/home/key-features-grid";
import KeyFeaturesReport from "@/containers/home/key-features-report";
import Vision from "@/containers/home/vision";

export const metadata: Metadata = {
  title: "AmazoniaForever360+",
  description: "",
};

export default function HomePage() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
      <Hero />
      <About />
      <KeyFeaturesReport />
      <KeyFeaturesGrid />
      <InformationOn />
      <Glance />
      <Vision />
      <Hub />
      <Help />
      <Footer />
    </main>
  );
}
