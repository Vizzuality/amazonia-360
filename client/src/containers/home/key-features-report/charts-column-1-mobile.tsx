"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export default function KeyFeaturesChartsColumn1Mobile({ inView }: { inView: boolean }) {
  return (
    <div
      className={cn({
        "relative -left-1/3 flex max-h-[132px] space-x-4 lg:max-h-none lg:flex-col lg:space-y-4 lg:space-x-0": true,
        "animate-left-to-right": inView,
      })}
    >
      <Image
        alt="amazonia-coverage"
        src="/images/home/key-features-report/chart-06.png"
        height={132}
        width={240}
        className="shrink-0 object-contain"
        draggable={false}
      />

      <Image
        alt="altitude-chart"
        src="/images/home/key-features-report/chart-03.avif"
        height={132}
        width={240}
        className="shrink-0 object-contain"
        draggable={false}
      />

      <Image
        alt="map"
        src="/images/home/key-features-report/chart-04.avif"
        height={132}
        width={240}
        className="shrink-0 object-contain"
        draggable={false}
      />

      <Image
        alt="population"
        src="/images/home/key-features-report/chart-05.png"
        height={132}
        width={240}
        className="shrink-0 object-contain"
        draggable={false}
      />

      <Image
        alt="funding-by-type-chart"
        src="/images/home/key-features-report/chart-07.png"
        height={132}
        width={240}
        className="shrink-0 object-contain"
        draggable={false}
      />
    </div>
  );
}
