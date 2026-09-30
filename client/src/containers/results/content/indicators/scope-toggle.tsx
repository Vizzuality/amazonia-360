"use client";

import { useMemo } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useLocale, useTranslations } from "next-intl";

import { useGetIndicators } from "@/lib/indicators";
import { getIndicatorCounterpart, getIndicatorCounterpartMap } from "@/lib/indicators/substitution";
import { useReportCountry } from "@/lib/report/use-report-country";
import { cn } from "@/lib/utils";

import { Indicator, VisualizationTypes } from "@/types/indicator";
import { Topic } from "@/types/topic";

import { TopicView } from "@/app/(frontend)/parsers";
import { useFormTopics } from "@/app/(frontend)/store";

import { getIndicatorScopeBadgeKey } from "@/containers/indicators/scope-badge";

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

function ScopeOption({
  label,
  checked,
  disabled,
  tooltip,
  onSelect,
}: Readonly<{
  label: string;
  checked: boolean;
  disabled: boolean;
  tooltip: string;
  onSelect: () => void;
}>) {
  const option = (
    <button
      type="button"
      aria-pressed={checked}
      aria-disabled={disabled || undefined}
      onClick={checked || disabled ? undefined : onSelect}
      className={cn(
        "h-4 w-[30px] rounded-[2px] text-center text-[10px] leading-4 font-semibold",
        checked && "text-foreground bg-cyan-200",
        !checked && "text-muted-foreground opacity-50 hover:opacity-100",
        disabled && "cursor-not-allowed hover:opacity-50",
      )}
    >
      {label}
      {!checked && <span className="sr-only">{tooltip}</span>}
    </button>
  );

  if (checked) return option;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{option}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent sideOffset={4} className="max-w-72">
          {tooltip}
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
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

  const counterpart = useMemo(
    () => getIndicatorCounterpart(indicatorId, type, getIndicatorCounterpartMap(indicators ?? [])),
    [indicators, indicatorId, type],
  );

  if (!counterpart) return null;

  const { id: counterpartId, name } = counterpart;
  const isNational = !counterpart.country;
  const nationalCode = isNational
    ? (indicators?.find((indicator) => indicator.id === indicatorId)?.country ?? null)
    : counterpart.country;

  // The grid keys every widget on indicator id + type, so two widgets sharing that pair in one
  // topic collide: `results/content/item/index.tsx:83`.
  const isTaken = !!topics?.some(
    (topic) =>
      topic.topic_id === topicId &&
      topic.indicators?.some(
        (indicator) => indicator.indicator_id === counterpartId && indicator.type === type,
      ),
  );

  const tooltip = getScopeToggleLabel({ isTaken, name, t });

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
    <fieldset
      aria-label={t("indicator-scope-toggle")}
      data-testid="indicator-scope-switch"
      className="border-border mr-1 flex h-5 shrink-0 items-center rounded border p-px"
    >
      <ScopeOption
        label={t(getIndicatorScopeBadgeKey(nationalCode) as Parameters<typeof t>[0])}
        checked={isNational}
        disabled={isTaken}
        tooltip={tooltip}
        onSelect={handleSwap}
      />
      <ScopeOption
        label={t(getIndicatorScopeBadgeKey(null) as Parameters<typeof t>[0])}
        checked={!isNational}
        disabled={isTaken}
        tooltip={tooltip}
        onSelect={handleSwap}
      />
    </fieldset>
  );
}
