"use client";

import { LayoutDashboard, MapPinned, Share2 } from "lucide-react";

// import { useIndicatorsId } from "@/lib/indicators";

export default function KeyFeatures() {
  // const indicator = useIndicatorsId(6);

  return (
    <section className="container flex flex-col py-10 md:py-28 lg:flex-row lg:space-x-28">
      <div className="flex w-full flex-col md:w-[40%]">
        <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
          key features
        </h3>
        <h2 className="pb-6 text-2xl text-blue-400 lg:text-4xl">Generate quick reports</h2>
        <p className="text-base font-normal text-blue-900 lg:text-lg">
          Personalize your experience with reports that adapt to your focus areas, providing you
          with the targeted insights you need to make informed decisions.
        </p>
        <ul className="mt-20 flex space-x-2 lg:mt-6">
          <li className="flex w-full">
            <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-blue-50 p-4">
              <MapPinned size={32} strokeWidth={1} className="text-cyan-600" />
              <h4 className="font-bold text-blue-500">Select area of interest</h4>
            </div>
          </li>
          <li className="flex w-full">
            <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-blue-50 p-4">
              <LayoutDashboard size={32} strokeWidth={1} className="text-cyan-600" />
              <h4 className="font-bold text-blue-500">Define topics of interest</h4>
            </div>
          </li>
          <li className="flex w-full">
            <div className="flex flex-col items-start justify-start space-y-2 rounded-sm bg-blue-50 p-4">
              <Share2 size={32} strokeWidth={1} className="h-8 w-8 text-cyan-600" />
              <h4 className="font-bold text-blue-500">Share and download</h4>
            </div>
          </li>
        </ul>
      </div>
      {/* <div className="max-h-50vh grid w-full grid-cols-2 bg-red-700">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{indicator?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {indicator && indicator.resource.type === "feature" && (
                <ChartIndicators {...indicator} resource={indicator.resource} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{indicator?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {indicator && indicator.resource.type === "feature" && (
                <ChartIndicators {...indicator} resource={indicator.resource} />
              )}

              {indicator && indicator.resource.type === "feature" && (
                <NumericIndicators {...indicator} resource={indicator.resource} />
              )}
              {indicator && indicator.resource.type === "imagery-tile" && (
                <NumericImageryIndicators {...indicator} resource={indicator.resource} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{indicator?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {indicator && indicator.resource.type === "feature" && (
                <ChartIndicators {...indicator} resource={indicator.resource} />
              )}

              {indicator && indicator.resource.type === "feature" && (
                <NumericIndicators {...indicator} resource={indicator.resource} />
              )}
              {indicator && indicator.resource.type === "imagery-tile" && (
                <NumericImageryIndicators {...indicator} resource={indicator.resource} />
              )}
            </CardContent>
          </Card>
        </div>
      </div> */}
    </section>
  );
}
