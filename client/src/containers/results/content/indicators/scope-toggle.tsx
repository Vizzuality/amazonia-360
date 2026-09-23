"use client";

import { useMemo } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useLocale, useTranslations } from "next-intl";
import { LuArrowLeftRight } from "react-icons/lu";

import { useGetIndicators } from "@/lib/indicators";
import { getIndicatorCounterpartMap } from "@/lib/report-indicator-substitution";
import { useReportCountry } from "@/lib/use-report-country";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { TopicView } from "@/app/(frontend)/parsers";
import { useFormTopics } from "@/app/(frontend)/store";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function getScopeToggleLabel({
  isTaken,
  name,
  t,
}: {
  isTaken: boolean;
  name: string;
  t: ReturnType<typeof useTranslations>;
}): string {
  if (!name) return t("indicator-scope-toggle");
  if (isTaken) return t("indicator-scope-toggle-taken", { name });
  return t("indicator-scope-toggle-to", { name });
}

export default function IndicatorScopeToggle({
  indicatorId,
  topicId,
  type,
}: Readonly<{
  indicatorId: Indicator["id"];
  topicId: Topic["id"];
  type: VisualizationTypes;
}>) {
  const t = useTranslations();
  const locale = useLocale();
  const country = useReportCountry();
  const { topics, setTopics } = useFormTopics();

  const { data: indicators } = useGetIndicators(locale, undefined, country);

  const counterpartId = useMemo(
    () => getIndicatorCounterpartMap(indicators ?? []).get(indicatorId) ?? null,
    [indicators, indicatorId],
  );

  if (counterpartId === null) return null;

  const counterpart = indicators?.find((indicator) => indicator.id === counterpartId);
  const name = counterpart?.name ?? "";

  // The grid keys every widget on indicator id + type, so two widgets sharing that pair in one
  // topic collide: `results/content/item/index.tsx:83`.
  const isTaken = !!topics?.some(
    (topic) =>
      topic.topic_id === topicId &&
      topic.indicators?.some(
        (indicator) => indicator.indicator_id === counterpartId && indicator.type === type,
      ),
  );

  const label = getScopeToggleLabel({ isTaken, name, t });

  const handleSwap = () => {
    setTopics((prev: TopicView[]) =>
      prev.map((topic) =>
        topic.topic_id !== topicId
          ? topic
          : {
              ...topic,
              indicators: topic.indicators?.map((indicator) =>
                indicator.indicator_id === indicatorId && indicator.type === type
                  ? { ...indicator, indicator_id: counterpartId }
                  : indicator,
              ),
            },
      ),
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleSwap}
          disabled={isTaken}
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center rounded-xs hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <LuArrowLeftRight className="text-blue-600" />
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent sideOffset={0} className="max-w-72">
          {label}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
