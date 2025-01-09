"use client";

import { useInView } from "react-intersection-observer";

import CardsContainer from "./cards-container";
import KeyFeaturesChartsColumn1 from "./charts-column-1";
import KeyFeaturesChartsColumn2 from "./charts-column-2";

export default function KeyFeatures() {
  const [refCol, inViewCol] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <section className="container flex h-fit w-full justify-between">
      <div className="w-full max-w-lg">
        <CardsContainer />
      </div>
      <div
        ref={refCol}
        className="gap-4py-10 relative flex h-full w-full items-center justify-end md:py-28 lg:py-56"
      >
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-36 bg-gradient-to-b from-white to-transparent" />

        <KeyFeaturesChartsColumn1 inView={inViewCol} />

        <KeyFeaturesChartsColumn2 inView={inViewCol} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-36 bg-gradient-to-t from-white to-transparent" />
      </div>
    </section>
  );
}
