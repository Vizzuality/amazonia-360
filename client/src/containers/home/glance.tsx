"use client";
import { useCallback, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

export default function Glance() {
  const [chartOpt, setChartOpt] = useState<string | null>(null);
  // const MOCK_DATA = [
  //   { id: "Brazil", parent: "root", size: 61 },
  //   { id: "Peru", parent: "root", size: 12 },
  //   { id: "Bolivia", parent: "root", size: 9 },
  // ];

  const OPTIONS = [
    "Share of total Amazonia area %",
    "Amazonia Area in km2",
    "Amazonia Population in the country",
    "Share of Amazonia Population in the country (%)",
  ];

  const handleSingleValueChange = useCallback((e: string) => {
    setChartOpt(e);
  }, []);

  return (
    <section className="container flex md:space-x-28 py-10 md:py-28 md:flex-row flex-col">
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
      </div>
      <div className="w-full md:w-1/2 flex">
        <div className="flex items-center space-x-2">
          <h4 className="font-bold whitespace-nowrap text-sm">On the chart</h4>
          <Select onValueChange={handleSingleValueChange}>
            <SelectTrigger
              className="flex h-10 items-center justify-between rounded border border-gray-400 px-4"
              data-cy="filter-country-select"
            >
              <div>
                <SelectValue placeholder={""}> </SelectValue>
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
      </div>
    </section>
  );
}
