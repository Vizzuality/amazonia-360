"use client";

import LazyLottieComponent from "lottie-react";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

import animation from "./grid-animation-lottie.json";

export default function KeyFeaturesGrid() {
  return (
    <section className="flex bg-blue-50 px-4 md:px-0">
      <div className="flex flex-col-reverse justify-between py-10 md:container md:flex-row md:py-28 lg:gap-80">
        <div className="h-full max-w-lg items-center">
          <CardsContainer />
        </div>
        <div className="py-10 md:py-28 lg:py-56">
          <LazyLottieComponent
            id="grid-animation"
            animationData={animation}
            loop={true}
            autoplay={true}
            className="h-[600px] w-[600px]"
          />
        </div>
      </div>
    </section>
  );
}
