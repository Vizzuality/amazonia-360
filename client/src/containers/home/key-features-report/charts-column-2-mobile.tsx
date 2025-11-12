"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export default function KeyFeaturesChartsColumn2Mobile({ inView }: { inView: boolean }) {
  return (
    <div
      className={cn({
        "relative flex max-h-[186px] space-x-4 lg:max-h-none lg:flex-col lg:space-x-0 lg:space-y-4": true,
        "animate-right-to-left": inView,
      })}
    >
      <Image
        alt="landcover-chart"
        src="/images/home/key-features-report/chart-01.avif"
        height={186}
        width={314}
        className="object-contain"
        draggable={false}
      />

      <Image
        alt="biomes-by-type-chart"
        src="/images/home/key-features-report/chart-right-06.avif"
        height={186}
        width={314}
        className="object-contain"
        draggable={false}
      />

      <Image
        alt="indigenous-lands-chart"
        src="/images/home/key-features-report/chart-right-07.avif"
        height={186}
        width={314}
        className="object-contain"
        draggable={false}
      />
    </div>
  );
}
