import { Suspense } from "react";

import { Metadata } from "next";

import PageProviders from "@/app/report/page-providers";

import ReportLocation from "@/containers/report/location";
import Map from "@/containers/report/map";

export const metadata: Metadata = {
  title: "Report | location",
  description: "Report description",
};

export default function ReportPage() {
  return (
    <PageProviders>
      <main className="relative flex min-h-[calc(100svh_-_theme(space.20)_+_20px)] flex-col">
        <div className="pointer-events-none absolute bottom-8 left-0 top-10 z-10 w-full">
          <div className="container grid grid-cols-12">
            <div className="col-span-6 2xl:col-span-4">
              <Suspense fallback={null}>
                <ReportLocation />
              </Suspense>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <Map />
        </Suspense>
      </main>
    </PageProviders>
  );
}
