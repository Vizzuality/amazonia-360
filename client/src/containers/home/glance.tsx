"use client";
import { useCallback, useMemo, useState, useEffect } from "react";

import { useInView } from "react-intersection-observer";

import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";

import { formatNumber, formatPercentage } from "@/lib/formats";

import { CardInfo } from "@/containers/card";
import { MOSAIC_DATA, MOSAIC_OPTIONS, type MosaicIds } from "@/containers/home/constants";

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
  const [sectionInView, setImageInView] = useState(false);

  const { ref: sectionRef, inView: isSectionInView } = useInView({
    triggerOnce: false,
    threshold: 0.5,
  });

  useEffect(() => {
    if (isSectionInView) setImageInView(true);
  }, [isSectionInView]);

  const ordinalColorScale = useMemo(() => {
    return scaleOrdinal({
      domain: MOSAIC_DATA?.toSorted((a, b) => b[chartKey] - a[chartKey]).map((d) => d[chartKey]),
      range: CHROMA.scale(["#009ADE", "#93CAEB", "#DBEDF8"]).colors(MOSAIC_DATA?.length || 1),
    });
  }, [chartKey]);

  const parsedData: Data[] = useMemo(() => {
    return MOSAIC_DATA.map((d) => {
      return {
        label: d.country,
        color: ordinalColorScale(d[chartKey]),
        id: d.country,
        parent: "root",
        size: d[chartKey],
      };
    }).toSorted((a, b) => b.size - a.size);
  }, [chartKey, ordinalColorScale]);

  const handleSingleValueChange = useCallback((e: MosaicIds) => {
    setChartKey(e);
  }, []);

  const FORMAT = {
    amazonia_area_by_country_cartographic_area_sqkm: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber(node?.value || 0, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        notation: "compact",
      });
    },
    proportion_of_amazonia_area_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage(node?.value || 0, {
        maximumFractionDigits: 0,
      });
    },
    proportion_of_total_area_of_the_afp_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage(node?.value || 0, {
        maximumFractionDigits: 0,
      });
    },
    population_density_of_the_afp_zones_by_country_inhabitants_per_sqkm: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatNumber((node?.value || 0) * 100, {
        maximumFractionDigits: 2,
      });
    },
    proportion_of_the_population_of_the_amazonia_zone_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage(node?.value || 0, {
        maximumFractionDigits: 0,
      });
    },
    proportion_of_the_population_of_the_afp_by_country_percentage: (
      node: HierarchyRectangularNode<HierarchyNode<Data>>,
    ) => {
      return formatPercentage(node?.value || 0, {
        maximumFractionDigits: 0,
      });
    },
  };

  return (
    <section
      ref={sectionRef}
      className="container flex flex-col items-end py-10 md:flex-row md:space-x-28 md:py-28"
    >
      <div
        className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-44 ${sectionInView ? "animate-left-to-right overflow-hidden" : "opacity-0"}`}
      >
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
            Amazonia at a glance
          </h3>
          <h2 className="pb-6 text-2xl text-blue-400 lg:text-3xl xl:text-4xl">
            A mosaic of ecosystems and habitats
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            Amazonia spans over <span className="font-bold">6.7 million square kilometers</span>{" "}
            across South America. This vital region is a confluence of cultural diversity and
            environmental significance.
          </p>

          <div className="mt-7 flex flex-col space-y-1">
            <p className="text-xs font-semibold text-blue-900">View on the chart</p>
            <Select value={chartKey} onValueChange={handleSingleValueChange}>
              <SelectTrigger className="h-9 w-full rounded-sm">
                <SelectValue>
                  <p className="max-w-64 truncate md:max-w-80 lg:max-w-none">
                    {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.label || ""}
                  </p>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
                {MOSAIC_OPTIONS &&
                  MOSAIC_OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1 text-sm text-blue-300">
          <p className="text-base">Source: </p>
          <ul className="space-y-2">
            <li>
              <span>Global Human Settlement Layer (GHSL) - Population projection for 2025;</span>
              <CardInfo ids={[+"population"]} className="relative top-0.5 inline-flex" />
            </li>
            <li>Cartographic area</li>
          </ul>
        </div>
      </div>
      <div
        className={`mt-20 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${sectionInView ? "animate-right-to-left overflow-hidden" : "opacity-0"}`}
      >
        <header className="space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.label || ""}
          </h3>
          <p className="text-xs font-medium text-foreground">
            {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.description || ""}
          </p>
        </header>
        <div className="w-full">
          <MarimekkoChart format={FORMAT[chartKey]} data={parsedData} className="h-[450px]" />
        </div>
      </div>
    </section>
  );
}
