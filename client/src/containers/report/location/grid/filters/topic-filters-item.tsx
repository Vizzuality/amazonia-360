"use client";

import { useState, useEffect } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useAtom } from "jotai";
import { LuChevronRight } from "react-icons/lu";

import { useGetTopicsId } from "@/lib/topics";
import { cn } from "@/lib/utils";

import { DatasetMeta } from "@/types/generated/api.schemas";

import { selectedFiltersViewAtom } from "@/app/store";

import { GridCounterIndicators } from "./counter-filters";
import GridIndicatorFiltersItem from "./indicator-filters-item";

// TO - DO - type datasets
export default function GridTopicFiltersItem({
  id,
  datasets,
}: {
  id: number;
  datasets: DatasetMeta[];
}) {
  const [open, setOpen] = useState(false);
  const topic = useGetTopicsId(id);
  const [selectedFiltersView] = useAtom(selectedFiltersViewAtom);
  const datasetsIds = datasets.map((d) => d.var_name);
  useEffect(() => {
    if (selectedFiltersView) {
      setOpen(true);
    }
  }, [selectedFiltersView]);

  return (
    <div
      key={id}
      className={cn({
        "flex flex-col": true,
        "box-border border-b border-b-primary/20 pb-3": open,
      })}
    >
      <Collapsible open={open}>
        <div
          className={cn({
            "flex h-10 items-center space-x-4 rounded-[2px] px-0.5 py-2 hover:bg-secondary": true,
          })}
        >
          <CollapsibleTrigger
            className="flex w-full min-w-28 items-center justify-between text-sm"
            asChild
            onClick={(event) => {
              event.stopPropagation();
              setOpen(!open);
            }}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center justify-start space-x-1">
                <LuChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />

                <span className="whitespace flex-nowrap text-sm">{topic?.name}</span>
              </div>
              <GridCounterIndicators total={datasets.length} datasetsIds={datasetsIds} />
            </div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="ml-2.5 space-y-1 border-l border-blue-100 pl-2">
            {datasets.map((d) => (
              <GridIndicatorFiltersItem key={d.label} {...d} label={d.label as string} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
