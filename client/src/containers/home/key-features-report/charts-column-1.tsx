"use client";

import Image from "next/image";

export default function KeyFeaturesChartsColumn1({ inView }: { inView: boolean }) {
  return (
    <div
      className={`relative flex space-x-4 md:flex-col md:space-x-0 md:space-y-4 ${inView ? "animate-slide-up" : "translate-y-10"}`}
    >
      <Image
        alt="landcover-chart"
        src="/images/home/key-features-report/chart-01.avif"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="total-funding"
        src="/images/home/key-features-report/chart-02.avif"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="altitude-chart"
        src="/images/home/key-features-report/chart-03.avif"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />
      <Image
        alt="map"
        src="/images/home/key-features-report/chart-04.avif"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="population"
        src="/images/home/key-features-report/chart-05.png"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="amazonia-coverage"
        src="/images/home/key-features-report/chart-06.png"
        height={132}
        width={314}
        objectFit="contain"
        draggable={false}
      />

      <Image
        alt="funding-by-type-chart"
        src="/images/home/key-features-report/chart-07.png"
        height={124}
        width={314}
        objectFit="contain"
        draggable={false}
      />
    </div>
    // <div
    //   className={cn({
    //     "relative mt-20 flex max-h-[132px] space-x-4 md:max-h-none md:flex-col md:space-x-0 md:space-y-4":
    //       true,
    //     "animate-left-to-right": inView && isMobile,
    //     "animate-slide-up": inView && !isMobile,
    //     "translate-y-10": !inView && !isMobile,
    //   })}
    // >
    //   <Image
    //     alt="landcover-chart"
    //     src="/images/home/key-features-report/chart-01.avif"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="total-funding"
    //     src="/images/home/key-features-report/chart-02.avif"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="altitude-chart"
    //     src="/images/home/key-features-report/chart-03.avif"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="map"
    //     src="/images/home/key-features-report/chart-04.avif"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="population"
    //     src="/images/home/key-features-report/chart-05.png"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="amazonia-coverage"
    //     src="/images/home/key-features-report/chart-06.png"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />

    //   <Image
    //     alt="funding-by-type-chart"
    //     src="/images/home/key-features-report/chart-07.png"
    //     height={132}
    //     width={240}
    //     className="shrink-0"
    //     objectFit={isMobile ? "contain" : "cover"}
    //     draggable={false}
    //   />
    // </div>
  );
}
