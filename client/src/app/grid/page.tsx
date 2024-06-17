import { Metadata } from "next";

import PageProviders from "@/app/grid/page-providers";

import Map from "@/containers/grid/map";

export const metadata: Metadata = {
  title: "Grid | location",
  description: "Grid description",
};

export default function GridPage() {
  return (
    <PageProviders>
      <main className="relative flex flex-col min-h-[calc(100svh_-_theme(space.40)_+_1px)]">
        {/* <div className="absolute z-10 w-1/2 h-full left-0 top-0 bg-gradient-to-r from-slate-500/20 to-slate-500/0 pointer-events-none"></div> */}
        <div className="absolute top-1/2 left-0 z-10 w-full pointer-events-none -translate-y-1/2">
          <div className="container">Grid</div>
        </div>

        <Map />
      </main>
    </PageProviders>
  );
}
