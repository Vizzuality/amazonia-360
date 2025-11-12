"use client";

import { useMemo } from "react";

import Image from "next/image";

import { useAtom } from "jotai";
import { useLocale } from "next-intl";

import { PLACEHOLDER } from "@/lib/images";
import { useGetH3Indicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { indicatorsExpandAtom, useSyncGridDatasets } from "@/app/(frontend)/store";

import { Topic } from "@/constants/topics";

import SubtopicList from "@/containers/report/grid/subtopics";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type TopicsItemProps = Topic;

export default function TopicsItem({ id, name, image }: TopicsItemProps) {
  const locale = useLocale();
  const [gridDatasets] = useSyncGridDatasets();
  const [indicatorsExpand, setIndicatorsExpand] = useAtom(indicatorsExpandAtom);

  const { data: indicatorsData } = useGetH3Indicators({ topicId: id, locale });

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
          [id]: [],
        };
      } else {
        return {
          ...prev,
          [id]: undefined,
        };
      }
    });
  };

  if (!indicatorsData || !indicatorsData.length) return null;

  return (
    <div
      key={id}
      className={cn(
        "h-full w-full grow cursor-pointer overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <Collapsible open={!!indicatorsExpand?.[id]} onOpenChange={handleClick}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between space-x-2.5 p-1 transition-colors duration-300 ease-in-out hover:bg-blue-50",
          )}
        >
          <div className={cn("flex items-center space-x-2.5")}>
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-cyan-100">
              <Image
                src={image}
                alt={`${name}`}
                priority
                fill
                sizes="100%"
                placeholder={PLACEHOLDER(80, 80)}
                className={cn({
                  "object-cover": true,
                })}
              />
            </div>
            <div className="flex flex-col items-start justify-start space-y-1">
              <span className="text-sm font-bold transition-none">{name}</span>
            </div>
          </div>
          {!!SELECTED && (
            <Badge variant="secondary" className="rounded-full">
              {SELECTED}
            </Badge>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6">
          <SubtopicList topicId={id} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
