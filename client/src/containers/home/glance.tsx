"use client";
import { useCallback, useMemo, useState } from "react";

import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";

import { useFormatNumber, useFormatPercentage } from "@/lib/formats";

import {
  MOSAIC_DATA,
  MOSAIC_OPTIONS,
  type MosaicIds,
} from "@/containers/home/constants";

import MarimekkoChart from "@/components/charts/marimekko";
import { type Data } from "@/components/charts/marimekko";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

export default function Glance() {
  const [chartKey, setChartKey] = useState<MosaicIds>(MOSAIC_OPTIONS[4].key);

  const parsedData = useMemo(() => {
    return MOSAIC_DATA.map((d) => {
      return {
        label: d.country,
        color: "",
        id: d.country,
        parent: "root",
        size: d[chartKey],
      };
    });
  }, [chartKey]);

  const ordinalColorScale = scaleOrdinal({
    domain: parsedData?.map((d) => d),
    range: ["#009ADE", "#93CAEB", "#DBEDF8"],
  });

  const handleSingleValueChange = useCallback((e: MosaicIds) => {
    setChartKey(e);
  }, []);

  const { format: formatPercentage } = useFormatPercentage({
    maximumFractionDigits: 0,
  });
  const { format: formatNumber } = useFormatNumber({
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    notation: "compact",
  });

  const FORMAT = {
    country_total_cartographic_area_sqkm: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber(node?.value || 0);
    },
    amazonia_area_by_country_cartographic_area_sqkm: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber(node?.value || 0);
    },
    proportion_of_amazonia_area_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage((node?.value || 0) / (node?.parent?.value || 1));
    },
    proportion_of_total_area_of_the_afp_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage((node?.value || 0) / (node?.parent?.value || 1));
    },
    total_population_by_country_ghspop25: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber(node?.value || 0);
    },
    population_of_the_amazonia_zone_by_country_ghspop25: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber(node?.value || 0);
    },
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage((node?.value || 0) / (node?.parent?.value || 1));
    },
    proportion_of_the_population_of_the_afp_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage((node?.value || 0) / (node?.parent?.value || 1));
    },
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage((node?.value || 0) / (node?.parent?.value || 1));
    },
  };

  return (
    <section className="container flex md:space-x-28 py-10 md:py-28 md:flex-row flex-col items-end">
      <div className="flex flex-col w-full md:w-1/2">
        <h3 className="uppercase text-sm font-extrabold text-cyan-500 tracking-wide-lg">
          Amazonia at a glance
        </h3>
        <h2 className="text-blue-400 text-2xl lg:text-4xl pb-6">
          A mosaic of ecosystems and habitats
        </h2>
        <p className="text-blue-900 text-base lg:text-lg font-normal">
          Amazonia spans over 6.7 million square kilometers across South
          America. This vital region is a confluence of cultural diversity and
          environmental significance.
        </p>
        <p className="text-blue-300 text-sm mt-10 md:mt-48">
          Source: Population - GHS2025; Area - ArcGIS calculations{" "}
        </p>
      </div>
      <div className="w-full md:w-1/2 flex flex-col space-y-10 mt-20 md:mt-0">
        <div className="flex items-center lg:space-x-2 justify-end">
          <Select onValueChange={handleSingleValueChange}>
            <SelectTrigger className="w-full md:w-96 lg:w-[550px]">
              <div>
                <SelectValue> </SelectValue>

                <p className="truncate max-w-64 md:max-w-80 lg:max-w-none">
                  {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.label ||
                    ""}
                </p>
              </div>
            </SelectTrigger>
            <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
              {MOSAIC_OPTIONS &&
                MOSAIC_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.key}
                    value={opt.key}
                    className="cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full">
          <MarimekkoChart
            format={FORMAT[chartKey]}
            data={parsedData}
            colorScale={ordinalColorScale}
            className="h-[488px]"
          />
        </div>
      </div>
    </section>
  );
}
