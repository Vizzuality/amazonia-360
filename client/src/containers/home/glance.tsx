"use client";
import { useCallback, useMemo, useState } from "react";

import { useInView } from "react-intersection-observer";

import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";
import { LuCheck, LuChevronDown } from "react-icons/lu";

import { formatNumber, formatPercentage } from "@/lib/formats";
import { cn } from "@/lib/utils";

import { CardInfo } from "@/containers/card";
import { MOSAIC_DATA, MOSAIC_OPTIONS, type MosaicIds } from "@/containers/home/constants";

import MarimekkoChart from "@/components/charts/marimekko";
import { type Data } from "@/components/charts/marimekko";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Glance() {
  const [chartKey, setChartKey] = useState<MosaicIds>(MOSAIC_OPTIONS[4].key);
  const [open, setOpen] = useState<boolean>(false);

  const { ref: sectionRef, inView: isSectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.25,
  });

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
    setOpen(false);
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
      className="container flex flex-col items-end pt-20 md:flex-row md:items-start md:space-x-28 md:py-28"
    >
      <div
        className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-10 lg:space-y-44 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-left-20" : "md:opacity-0"}`}
      >
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wide-lg text-cyan-500">
            Amazonia at a glance
          </h3>
          <h2 className="max-w-44 pb-6 text-2xl text-blue-400 md:max-w-[520px] lg:text-3xl xl:text-4xl">
            A mosaic of ecosystems and habitats
          </h2>
          <p className="text-base font-normal text-blue-900 lg:text-lg">
            <span className="font-bold">
              {" "}
              A Continent-sized Mosaic of Cultures and Nature Across Eight Countries
            </span>
            Spanning 8.4 million square kilometers across eight South American countries, Amazonia
            represents one of the planet&apos;s most diverse confluences of cultures and ecosystems.
          </p>

          <div className="mt-7 flex flex-col space-y-1">
            <p className="text-xs font-semibold text-blue-900">Select indicator</p>

            <Popover open={open}>
              <PopoverTrigger
                className="relative h-9 w-full rounded-sm border border-input focus:border-foreground active:border-foreground"
                onClick={() => setOpen(!open)}
              >
                <p className="max-w-64 truncate px-3 py-2 text-left text-sm md:max-w-80 lg:max-w-none">
                  {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.label || ""}
                </p>
                <LuChevronDown className="absolute right-2 top-2 h-5 w-5 text-blue-900" />
              </PopoverTrigger>

              <PopoverContent
                align="start"
                alignOffset={-2}
                className="no-scrollbar group z-10 max-h-96 w-popover-width overflow-y-auto border-none border-input bg-white px-1 py-3 text-sm shadow-md"
              >
                {MOSAIC_OPTIONS &&
                  MOSAIC_OPTIONS.map((opt) => (
                    <div
                      key={opt.key}
                      className={cn({
                        "flex cursor-pointer items-center justify-between rounded-sm px-3 py-2 hover:bg-blue-50":
                          true,
                        "bg-blue-50 group-hover:bg-transparent": opt.key === chartKey,
                      })}
                      onClick={() => handleSingleValueChange(opt.key)}
                    >
                      <span>{opt.label}</span>
                      {opt.key === chartKey && <LuCheck className="text-blue-900" />}
                    </div>
                  ))}
              </PopoverContent>
            </Popover>
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
        className={`mt-10 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${isSectionInView ? "overflow-hidden md:duration-700 md:animate-in md:fade-in-0 md:slide-in-from-right-20" : "opacity-0"}`}
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
          <MarimekkoChart format={FORMAT[chartKey]} data={parsedData} className="h-[510px]" />
        </div>
      </div>
    </section>
  );
}
