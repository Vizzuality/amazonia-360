"use client";

import { useInView } from "react-intersection-observer";

import { Media } from "@/containers/media";

import CardsContainer from "./cards-container";
import KeyFeaturesChartsColumn1 from "./charts-column-1";
import KeyFeaturesChartsColumn1Mobile from "./charts-column-1-mobile";
import KeyFeaturesChartsColumn2 from "./charts-column-2";
import KeyFeaturesChartsColumn2Mobile from "./charts-column-2-mobile";

export default function KeyFeatures() {
  const [refCol, inViewCol] = useInView({
    triggerOnce: false,
    threshold: 0.2,
  });

  return (
    <section className="relative mx-4 flex w-full flex-col-reverse justify-between md:container md:h-screen md:max-h-[720px] md:flex-row">
      {/* Left Section */}
      <div className="w-full max-w-lg">
        <CardsContainer />
      </div>

      {/* Right Section */}
      <div ref={refCol} className="relative h-full w-full overflow-hidden">
        {/* Gradients */}
        <Media greaterThanOrEqual="md">
          <>
            <div className="pointer-events-none top-0 z-10 h-36 bg-gradient-to-b from-white to-transparent md:absolute md:left-0 md:right-0" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-white to-transparent" />
          </>
        </Media>

        <Media lessThan="md">
          <>
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-5 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-5 bg-gradient-to-l from-white to-transparent" />
          </>
        </Media>

        {/* Charts */}
        <div className="relative flex w-full flex-col items-center justify-end md:h-full md:flex-row md:items-center md:gap-4">
          <div className="relative flex flex-row justify-center md:flex-col">
            <Media greaterThanOrEqual="md">
              <KeyFeaturesChartsColumn1 inView={inViewCol} />
            </Media>

            <Media lessThan="md">
              <KeyFeaturesChartsColumn1Mobile inView={true} />
            </Media>
          </div>

          <div className="relative mt-4 flex flex-col justify-center md:mt-0 md:translate-y-[20px]">
            <Media greaterThanOrEqual="md">
              <KeyFeaturesChartsColumn2 inView={inViewCol} />
            </Media>

            <Media lessThan="md">
              <KeyFeaturesChartsColumn2Mobile inView={true} />
            </Media>
          </div>
        </div>
      </div>
    </section>
  );
}
