"use client";

import Image from "next/image";

export default function KeyFeaturesChartsColumn2({ inView }: { inView: boolean }) {
  return (
    <div
      className={`relative flex space-x-4 md:flex-col md:space-x-0 md:space-y-4 ${inView ? "animate-slide-down" : "translate-y-[-10px] opacity-0"}`}
    >
      <Image
        alt="biomes-chart"
        src="/images/home/key-features-report/biomes-chart.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="landcover-chart"
        src="/images/home/key-features-report/landcover-chart.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />
    </div>
  );
}
