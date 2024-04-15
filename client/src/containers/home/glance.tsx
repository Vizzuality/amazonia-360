"use client";
import { useCallback, useState } from "react";

import { scaleOrdinal } from "@visx/scale";

import MarimekkoChart from "@/components/charts/marimekko";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

export default function Glance() {
  const [chartOpt, setChartOpt] = useState<string | null>(null);
  const MOCK_DATA = [
    { label: "Brazil", color: "", id: "Brazil", parent: "root", size: 40 },
    { label: "Peru", color: "", id: "Peru", parent: "root", size: 10 },
    { label: "Bolivia", color: "", id: "Bolivia", parent: "root", size: 30 },
    { label: "Guatemala", color: "", id: "Bolivia", parent: "root", size: 20 },
  ];

  const OPTIONS = [
    "Share of total Amazonia area %",
    "Amazonia Area in km2",
    "Amazonia Population in the country",
    "Share of Amazonia Population in the country (%)",
  ];

  const ordinalColorScale = scaleOrdinal({
    domain: MOCK_DATA?.map((d) => d),
    range: ["#009ADE", "#93CAEB", "#DBEDF8"],
  });

  const handleSingleValueChange = useCallback((e: string) => {
    setChartOpt(e);
  }, []);

  return (
    <section className="container flex md:space-x-28 py-10 md:py-28 md:flex-row flex-col items-end">
      <div className="flex flex-col w-full md:w-1/2">
        <h3 className="uppercase text-sm font-extrabold text-cyan-500">
          Amazonia at a glance
        </h3>
        <h2 className="text-blue-400 text-2xl lg:text-4xl pb-6">
          A mosaic of ecosystems and habitats
        </h2>
        <p className="text-blue-900 text-base lg:text-lg font-light">
          Amazonia spans over 6.7 million square kilometers across South
          America. This vital region is a confluence of cultural diversity and
          environmental significance.
        </p>
        <p className="text-blue-300 text-sm mt-10 md:mt-48">Source: </p>
      </div>
      <div className="w-full md:w-1/2 flex flex-col space-y-10 mt-20 md:mt-0">
        <div className="flex items-center space-x-2 justify-end">
          <h4 className="font-bold whitespace-nowrap text-sm">On the chart</h4>
          <Select onValueChange={handleSingleValueChange}>
            <SelectTrigger className="w-96">
              <div>
                <SelectValue placeholder={OPTIONS[0]}> </SelectValue>
                {chartOpt}
              </div>
            </SelectTrigger>
            <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
              {OPTIONS &&
                OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt as string}
                    className="cursor-pointer"
                  >
                    {opt}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <MarimekkoChart
            data={MOCK_DATA}
            colorScale={ordinalColorScale}
            className="h-[488px]"
          />
        </div>
      </div>
    </section>
  );
}
