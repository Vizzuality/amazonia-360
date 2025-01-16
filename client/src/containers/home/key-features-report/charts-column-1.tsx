"use client";

import Image from "next/image";

export default function KeyFeaturesChartsColumn1({ inView }: { inView: boolean }) {
  return (
    <div
      className={`relative flex space-x-4 md:flex-col md:space-x-0 md:space-y-4 ${inView ? "animate-slide-up" : "translate-y-10 opacity-0"}`}
    >
      <Image
        alt="population-chart"
        src="/images/home/key-features-report/population-chart.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="altitude-chart"
        src="/images/home/key-features-report/altitude-chart.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="fires-chart"
        src="/images/home/key-features-report/fires-chart.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />
    </div>
  );
}
