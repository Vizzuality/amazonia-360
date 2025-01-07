"use client";

import LazyLottieComponent from "lottie-react";

import CardsContainer from "@/containers/home/key-features-grid/cards-container";

import animation from "./grid-animation-lottie.json";

export default function KeyFeaturesGrid() {
  return (
    <section className="flex bg-blue-50 px-4">
      <div className="flex flex-col-reverse justify-between md:container md:flex-row">
        <div className="h-full max-w-lg items-center">
          <CardsContainer />
        </div>
        <div className="py-10 md:py-28 lg:py-56">
          <LazyLottieComponent
            id="grid-animation"
            animationData={animation}
            loop={true}
            autoplay={true}
            className="md:h-[500px] md:w-[500px] lg:h-[600px] lg:w-[600px] xl:h-[650px] xl:w-[650px]"
          />
        </div>
      </div>
    </section>
  );
}
