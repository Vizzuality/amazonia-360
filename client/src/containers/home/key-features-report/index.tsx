"use client";

import { useInView } from "react-intersection-observer";

import { Media } from "@/containers/media";

import CardsContainer from "./cards-container";
import KeyFeaturesChartsColumn1 from "./charts-column-1";
import KeyFeaturesChartsColumn1Mobile from "./charts-column-1-mobile";
import KeyFeaturesChartsColumn2 from "./charts-column-2";
import KeyFeaturesChartsColumn2Mobile from "./charts-column-2-mobile";

export default function KeyFeatures() {
  const [ref, inViewCol] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section
      ref={ref}
      className="container relative grid max-h-svh w-full grid-cols-12 overflow-hidden"
    >
      {/* Left Section */}
      <div className="col-span-12 h-full max-w-lg items-center lg:col-span-6">
        <CardsContainer />
      </div>

      {/* Right Section */}
      <div className="relative order-1 col-span-12 lg:order-2 lg:col-span-5 lg:col-start-8">
        {/* Gradients */}
        <Media greaterThanOrEqual="lg">
          <>
            <div className="pointer-events-none top-0 z-10 h-36 bg-gradient-to-b from-white to-transparent lg:absolute lg:left-0 lg:right-0" />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-36 bg-gradient-to-t from-white to-transparent" />
          </>
        </Media>

        <Media lessThan="lg">
          <>
            <div className="pointer-events-none absolute -left-8 bottom-0 top-0 z-10 w-5 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute -right-8 bottom-0 top-0 z-10 w-5 bg-gradient-to-l from-white to-transparent" />
          </>
        </Media>

        {/* Charts */}
        <div className="relative flex w-full flex-col items-center justify-end lg:h-full lg:flex-row lg:items-center lg:gap-4">
          <div className="relative flex flex-row justify-center lg:flex-col">
            <Media greaterThanOrEqual="lg">
              <KeyFeaturesChartsColumn1 inView={inViewCol} />
            </Media>

            <Media lessThan="lg">
              <KeyFeaturesChartsColumn1Mobile inView={true} />
            </Media>
          </div>

          <div className="relative mt-4 flex flex-col justify-center lg:mt-0 lg:translate-y-[20px]">
            <Media greaterThanOrEqual="lg">
              <KeyFeaturesChartsColumn2 inView={inViewCol} />
            </Media>

            <Media lessThan="lg">
              <KeyFeaturesChartsColumn2Mobile inView={true} />
            </Media>
          </div>
        </div>
      </div>
    </section>
  );
}
