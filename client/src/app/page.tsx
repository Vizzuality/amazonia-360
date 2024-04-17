import { Metadata } from "next";

import Glance from "@/containers/home/glance";
import Help from "@/containers/home/help";
import Hero from "@/containers/home/hero";
import Hub from "@/containers/home/hub";
import InformationOn from "@/containers/home/information-on";
import KeyFeatures from "@/containers/home/key-features";
import Vision from "@/containers/home/vision";

export const metadata: Metadata = {
  title: "Amazonia360",
  description: "",
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KeyFeatures />
      <InformationOn />
      <Glance />
      <Vision />
      <Hub />
      <Help />
    </main>
  );
}
