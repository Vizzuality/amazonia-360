"use client";

import { useCallback, useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtomValue } from "jotai";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { LuInfo, LuLoader, LuSparkles } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { AiSummary } from "@/app/(frontend)/parsers";
import { isGeneratingAIReportAtom, useSyncAiSummary } from "@/app/(frontend)/store";

import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import AiSidebarContentCard from "./card";

export default function AiSidebarContent() {
  const t = useTranslations();

  const AUDIENCES = [
    {
      value: "Normal",
      label: t("report-results-sidebar-ai-summaries-audience-normal-title"),
      description: t("report-results-sidebar-ai-summaries-audience-normal-description"),
    },
    {
      value: "Short",
      label: t("report-results-sidebar-ai-summaries-audience-short-title"),
      description: t("report-results-sidebar-ai-summaries-audience-short-description"),
    },
    {
      value: "Long",
      label: t("report-results-sidebar-ai-summaries-audience-long-title"),
      description: t("report-results-sidebar-ai-summaries-audience-long-description"),
    },
  ];

  const [aiSummary, setAiSummary] = useSyncAiSummary();
  const [ai_audience, setAiAudience] = useState<AiSummary["type"]>(aiSummary.type);
  const [ai_only_active, setAiOnlyActive] = useState<AiSummary["only_active"]>(
    aiSummary.only_active,
  );

  const isGeneratingAIReport = useAtomValue(isGeneratingAIReportAtom);
  const isGenerating =
    aiSummary.enabled &&
    !!isGeneratingAIReport &&
    Object.values(isGeneratingAIReport).some((v) => v);

  const handleClickAiGenerateSummary = useCallback(() => {
    setAiSummary({
      type: ai_audience,
      only_active: ai_only_active,
      enabled: true,
    });
  }, [ai_audience, ai_only_active, setAiSummary]);

  const handleClickClearAiSummary = useCallback(() => {
    setAiSummary({ ...aiSummary, enabled: false });
  }, [setAiSummary, aiSummary]);

  const handleClickAIAudience = useCallback(
    (value: AiSummary["type"]) => {
      setAiAudience(value);
    },
    [setAiAudience],
  );

  const handleClickAIOnlyActive = useCallback(() => {
    setAiOnlyActive((prev) => !prev);
  }, [setAiOnlyActive]);

  return (
    <div className="relative flex grow flex-col justify-between overflow-hidden">
      <div className="relative flex h-full w-full flex-1 grow flex-col space-y-4 overflow-hidden">
        <div className="px-6">
          <p className="text-sm font-medium leading-5 text-muted-foreground">
            {t("report-results-sidebar-ai-summaries-description")}
          </p>
        </div>

        <ScrollArea
          className={cn({
            "flex w-full grow flex-col px-6": true,
          })}
        >
          <div className="h-full w-full flex-1 space-y-4">
            {!isGenerating && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("report-results-sidebar-ai-summaries-audience-title")}
                </span>
                <RadioGroup
                  defaultValue={ai_audience}
                  className="flex flex-col gap-1.5"
                  onValueChange={(v) => handleClickAIAudience(v as AiSummary["type"])}
                >
                  {AUDIENCES.map((option) => (
                    <AiSidebarContentCard
                      key={option.value}
                      option={option}
                      active={ai_audience === option.value}
                    />
                  ))}
                </RadioGroup>
              </div>
            )}

            {!isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="text-sm font-medium text-foreground">
                      {t("report-results-sidebar-ai-summaries-checkbox-active-indicators")}
                    </span>
                    <Tooltip>
                      <TooltipTrigger>
                        <LuInfo className="h-full w-full" />
                      </TooltipTrigger>

                      <TooltipPortal>
                        <TooltipContent side="top" align="center">
                          <p className="max-w-80">
                            {t(
                              "report-results-sidebar-ai-summaries-checkbox-active-indicators-info",
                            )}
                          </p>

                          <TooltipArrow className="fill-foreground" width={10} height={5} />
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </div>
                  <Switch
                    className="h-4 w-8"
                    onCheckedChange={handleClickAIOnlyActive}
                    defaultChecked={aiSummary.only_active}
                  />
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="flex h-full w-full items-center justify-center py-20">
                <div className="flex w-full flex-col items-center justify-center space-y-2">
                  <span className="h-6 w-6 animate-spin text-blue-500">
                    <LuLoader className="h-6 w-6 text-foreground" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("report-results-sidebar-ai-summaries-generating")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="relative flex w-full flex-col justify-end px-6">
          <div className="flex items-start space-x-4 rounded-sm border border-border bg-blue-50 p-3">
            <CircleAlert className="text-alert h-4 w-4 shrink-0" />
            <p className="text-xs font-medium text-foreground">
              {t("report-results-sidebar-ai-summaries-generating-info")}.
            </p>
          </div>
          <div className="mt-4 flex justify-between space-x-2">
            <Button variant="outline" className="w-full" onClick={handleClickClearAiSummary}>
              {t("clear")}
            </Button>
            <Button className="w-full space-x-2" onClick={handleClickAiGenerateSummary}>
              <LuSparkles />
              <span>{t("generate")}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
