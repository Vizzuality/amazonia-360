"use client";

import { HexagonIcon } from "@/components/ui/icons/hexagon";
import { ReportIcon } from "@/components/ui/icons/report";
import { WandIcon } from "@/components/ui/icons/wand";

export default function KeyFeaturesGrid() {
  return (
    <section className="bg-blue-50">
      <div className="container flex flex-col bg-blue-50 py-10 md:py-28 lg:flex-row lg:space-x-28">
        <div className="flex w-full flex-col md:w-[40%]">
          <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
            key features
          </h3>
          <h2 className="max-w-[475px] pb-6 text-2xl text-blue-400 md:text-4xl">
            The power of Amazonia Grid
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            Personalize your experience with reports that adapt to your focus areas, providing you
            with the targeted insights you need to make informed decisions.
          </p>
          <ul className="mt-20 flex space-x-2 lg:mt-6">
            <li className="flex w-full">
              <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-white p-4">
                <HexagonIcon className="h-8 w-8 text-cyan-600" />
                <h4 className="font-bold text-blue-500">Identify hotspots</h4>
              </div>
            </li>
            <li className="flex w-full">
              <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-white p-4">
                <WandIcon className="text-cyan-600" />
                <h4 className="font-bold text-blue-500">Redefine your area </h4>
              </div>
            </li>
            <li className="flex w-full">
              <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-white p-4">
                <ReportIcon className="text-cyan-600" />
                <h4 className="font-bold text-blue-500">Create report</h4>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
