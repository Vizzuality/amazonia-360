"use client";

import { useMemo } from "react";

import { useAtom } from "jotai";
import { LuChevronRight } from "react-icons/lu";
import { useLocale } from "use-intl";

import { useScrollOnExpand } from "@/lib/hooks";
import { useGetDefaultIndicators } from "@/lib/indicators";
import { indicatorsExpandAtom, useSyncIndicators } from "@/lib/url-state/store";
import { cn } from "@/lib/utils";

import { Subtopic } from "@/types/topic";

import IndicatorsList from "@/containers/report/indicators/list";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function SubtopicsItem({ id, topic_id, name }: Subtopic) {
  const locale = useLocale();

  const { data: indicatorsData } = useGetDefaultIndicators({
    subtopicId: id,
    locale,
  });
  const [indicators] = useSyncIndicators();
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);
  const scrollRef = useScrollOnExpand(!!indicatorsExpand?.[topic_id]?.includes(id));

  const SELECTED = useMemo(() => {
    if (!indicatorsData || !indicators) return 0;
    return indicatorsData.filter((indicator) => indicators.includes(indicator.id)).length;
  }, [indicatorsData, indicators]);

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
      ref={scrollRef as React.RefObject<HTMLDivElement | null>}
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-xs bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[topic_id]?.includes(id)} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex h-5 w-full items-center justify-between gap-2 px-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center gap-2")}>
            <LuChevronRight
              className={cn("h-4 w-4 text-blue-500 transition-transform duration-300", {
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
