"use client";

import Image from "next/image";

export default function KeyFeaturesChartsColumn2({ inView }: { inView: boolean }) {
  return (
    <div
      className={`relative flex space-x-4 md:flex-col md:space-x-0 md:space-y-4 ${inView ? "animate-slide-down" : "translate-y-[-10px]"}`}
    >
      <Image
        alt="funding-by-type-chart"
        src="/images/home/key-features-report/chart-right-01.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="funding-operations-chart"
        src="/images/home/key-features-report/chart-right-02.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="frequency-of-forest-fires-chart"
        src="/images/home/key-features-report/chart-right-04.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />
      <Image
        alt="protection-chart"
        src="/images/home/key-features-report/chart-right-05.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="biomes-by-type-chart"
        src="/images/home/key-features-report/chart-right-06.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="indigenous-lands-chart"
        src="/images/home/key-features-report/chart-right-07.avif"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />
    </div>
  );
}
