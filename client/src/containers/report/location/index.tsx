"use client";

import { Suspense } from "react";

import { Media } from "@/containers/media";
import ReportLocationDesktop from "@/containers/report/location/desktop";
import ReportLocationMobile from "@/containers/report/location/mobile";
import MapContainer from "@/containers/report/map";

export default function ReportLocation() {
  return (
    <>
      <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 lg:col-span-5 2xl:col-span-4">
            <Suspense fallback={null}>
              <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
                <Media greaterThanOrEqual="lg">
                  <ReportLocationDesktop />
                </Media>

                <Media lessThan="lg">
                  <ReportLocationMobile />
                </Media>
              </aside>
            </Suspense>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <Media greaterThanOrEqual="lg" className="relative flex w-full grow flex-col">
          <MapContainer />
        </Media>
      </Suspense>
    </>
  );
}
