"use client";
import { useCallback, useMemo, useState } from "react";

import { useInView } from "react-intersection-observer";
import ReactMarkdown from "react-markdown";

import { HierarchyNode, HierarchyRectangularNode } from "@visx/hierarchy/lib/types";
import { scaleOrdinal } from "@visx/scale";
import CHROMA from "chroma-js";
import { useTranslations, useLocale } from "next-intl";
import { LuCheck, LuChevronDown } from "react-icons/lu";

import { formatNumber, formatPercentage } from "@/lib/formats";
import { cn } from "@/lib/utils";

import { CardInfo } from "@/containers/card";
import { MOSAIC_DATA, MOSAIC_OPTIONS, type MosaicIds } from "@/containers/home/constants";

import MarimekkoChart from "@/components/charts/marimekko";
import { type Data } from "@/components/charts/marimekko";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Glance() {
  const t = useTranslations();
  const [chartKey, setChartKey] = useState<MosaicIds>(MOSAIC_OPTIONS[4].key);
  const [open, setOpen] = useState<boolean>(false);

  const locale = useLocale();

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
        className={`flex w-full flex-col space-y-5 md:w-1/2 md:space-y-10 lg:space-y-44 ${isSectionInView ? "md:animate-in md:fade-in-0 md:slide-in-from-left-20 overflow-hidden md:duration-700" : "md:opacity-0"}`}
      >
        <div>
          <h3 className="tracking-wide-lg text-sm font-extrabold text-blue-400 uppercase">
            {t("landing-glance-note")}
          </h3>
          <h2 className="pb-6 text-2xl text-blue-600 md:max-w-[520px] lg:text-3xl xl:text-4xl">
            {t("landing-glance-title")}
          </h2>
          <div className="text-base font-normal text-blue-900 lg:text-lg">
            <ReactMarkdown>{t("landing-glance-description")}</ReactMarkdown>
          </div>

          <div className="mt-7 flex flex-col space-y-1">
            <p className="text-xs font-semibold text-blue-900">
              {t("landing-glance-chart-select")}
            </p>

            <Popover open={open}>
              <PopoverTrigger
                className="border-input focus:border-foreground active:border-foreground relative h-9 w-full rounded-xs border"
                onClick={() => setOpen(!open)}
              >
                <p className="max-w-64 truncate px-3 py-2 text-left text-sm md:max-w-80 lg:max-w-none">
                  {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.[
                    `label_${locale}` as keyof (typeof MOSAIC_OPTIONS)[number]
                  ] ?? ""}
                </p>
                <LuChevronDown className="absolute top-2 right-2 h-5 w-5 text-blue-900" />
              </PopoverTrigger>

              <PopoverContent
                align="start"
                alignOffset={-2}
                className="no-scrollbar group w-popover-width border-input z-10 max-h-96 overflow-y-auto border-none bg-white px-1 py-3 text-sm shadow-md"
              >
                {MOSAIC_OPTIONS &&
                  MOSAIC_OPTIONS.map((opt) => (
                    <div
                      key={opt.key}
                      className={cn({
                        "flex cursor-pointer items-center justify-between rounded-xs px-3 py-2 hover:bg-blue-50": true,
                        "bg-blue-50 group-hover:bg-transparent": opt.key === chartKey,
                      })}
                      onClick={() => handleSingleValueChange(opt.key)}
                    >
                      <span>{opt[`label_${locale}` as keyof typeof opt]}</span>
                      {opt.key === chartKey && <LuCheck className="text-blue-900" />}
                    </div>
                  ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="text-muted-foreground hidden space-y-1 text-xs md:block">
          <p className="text-xs lg:text-sm"> {t("landing-glance-chart-source-note")}</p>
          <ul className="space-y-2">
            <li>
              <span>{t("landing-glance-chart-source-title")}</span>
              <CardInfo ids={[+"population"]} className="relative top-0.5 inline-flex" />
            </li>
            <li>{t("landing-glance-chart-source")}</li>
          </ul>
        </div>
      </div>
      <div
        className={`mb-10 flex w-full flex-col space-y-4 md:mt-0 md:w-1/2 ${isSectionInView ? "md:animate-in md:fade-in-0 md:slide-in-from-right-20 overflow-hidden md:duration-700" : "opacity-0"}`}
      >
        <header className="hidden space-y-1 md:block">
          <h3 className="text-foreground text-xl font-semibold">
            {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.[
              `label_${locale}` as keyof (typeof MOSAIC_OPTIONS)[number]
            ] || ""}
          </h3>
          <p className="text-foreground text-xs font-medium">
            {MOSAIC_OPTIONS.find((opt) => opt.key === chartKey)?.[
              `description_${locale}` as keyof (typeof MOSAIC_OPTIONS)[number]
            ] || ""}
          </p>
        </header>
        <div className="w-full">
          <MarimekkoChart format={FORMAT[chartKey]} data={parsedData} className="h-[510px]" />
        </div>
        <div className="text-muted-foreground space-y-1 text-xs md:hidden">
          <p className="text-xs lg:text-sm"> {t("landing-glance-chart-source-note")}</p>
          <ul className="space-y-2">
            <li>
              <span>{t("landing-glance-chart-source-title")}</span>
              <CardInfo ids={[+"population"]} className="relative top-0.5 inline-flex" />
            </li>
            <li>{t("landing-glance-chart-source")}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
