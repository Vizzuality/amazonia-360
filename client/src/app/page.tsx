import { Metadata } from "next";

import Hero from "@/containers/home/hero";
import InformationOn from "@/containers/home/information-on";
import KeyFeatures from "@/containers/home/key-features";

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
    </main>
  );
}
