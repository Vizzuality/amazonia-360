"use client";

import { useMemo } from "react";

import { useAtom } from "jotai";
import { useLocale } from "next-intl";
import { LuChevronRight } from "react-icons/lu";

import { useGetH3Indicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import { indicatorsExpandAtom, useSyncGridDatasets } from "@/app/store";

import IndicatorsList from "@/containers/report/grid/list";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SubtopicsItem({ id, topic_id, name }: Subtopic) {
  const locale = useLocale();

  const { data: indicatorsData } = useGetH3Indicators({
    subtopicId: id,
    locale,
  });
  const [gridDatasets] = useSyncGridDatasets();
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  const SELECTED = useMemo(() => {
    if (!indicatorsData || !gridDatasets) return 0;
    return indicatorsData.filter((indicator) => gridDatasets.includes(indicator.resource.column))
      .length;
  }, [indicatorsData, gridDatasets]);

  const handleClick = (open: boolean) => {
    setIndicatorsExpand((prev) => {
      if (open) {
        return {
          ...prev,
          [topic_id]: [...(prev?.[topic_id] || []), id],
        };
      } else {
        return {
          ...prev,
          [topic_id]: (prev?.[topic_id] || []).filter((subtopicId) => subtopicId !== id),
        };
      }
    });
  };

  return (
    <div
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[topic_id]?.includes(id)} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center space-x-2.5")}>
            <LuChevronRight
              className={cn("h-4 w-4 transition-transform duration-300", {
                "rotate-90": !!indicatorsExpand?.[topic_id]?.includes(id),
              })}
            />
            <div className="flex flex-col items-start justify-start space-y-1">
              <span className="text-sm font-medium transition-none">{name}</span>
            </div>
          </div>
          {!!SELECTED && (
            <Badge variant="secondary" className="rounded-full text-2xs">
              {SELECTED}
            </Badge>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-2.5">
          <IndicatorsList subtopicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
