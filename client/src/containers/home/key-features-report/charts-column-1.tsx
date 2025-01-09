"use client";

import Image from "next/image";

export default function KeyFeaturesChartsColumn1({ inView }: { inView: boolean }) {
  return (
    <div className={`space-y-4 ${inView ? "animate-slide-up" : "translate-y-10 opacity-0"}`}>
      <Image
        alt="population-chart"
        src="/images/home/key-features-report/population-chart.png"
        height={124}
        width={314}
        objectFit="contain"
      />

      <Image
        alt="altitude-chart"
        src="/images/home/key-features-report/altitude-chart.png"
        height={124}
        width={314}
        objectFit="contain"
      />

      <Image
        alt="fires-chart"
        src="/images/home/key-features-report/fires-chart.png"
        height={124}
        width={314}
        objectFit="contain"
      />
    </div>
  );
}
