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
      <main className="relative flex min-h-[calc(100svh_-_theme(space.40)_+_1px)] flex-col">
        <div className="pointer-events-none absolute left-0 top-10 z-10 w-full">
          <div className="container">
            <ReportLocation />
          </div>
        </div>

        <Map />
      </main>
    </PageProviders>
  );
}
