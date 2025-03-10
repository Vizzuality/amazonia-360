"use client";

import { useCallback, useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useAtomValue } from "jotai";
import { CircleAlert } from "lucide-react";
import { LuInfo, LuLoader2, LuSparkles } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { AiSummary } from "@/app/parsers";
import { isGeneratingAIReportAtom, useSyncAiSummary } from "@/app/store";

import { Button } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import AiSidebarContentCard from "./card";

const AUDIENCES = [
  {
    value: "Normal",
    label: "Standard",
    description: "For clear and balanced information to suit any audience.",
  },
  {
    value: "Short",
    label: "Executive",
    description: "Quick, focused insights to convey key data effectively.",
  },
  {
    value: "Long",
    label: "Comprehensive",
    description: "Detailed and thorough for deep understanding and context.",
  },
];

export default function AiSidebarContent({ isSticky }: { isSticky: boolean }) {
  const [aiSummary, setAiSummary] = useSyncAiSummary();
  const [ai_audience, setAiAudience] = useState<AiSummary["type"]>(aiSummary.type);
  const [ai_only_active, setAiOnlyActive] = useState<AiSummary["only_active"]>(
    aiSummary.only_active,
  );

  const isGeneratingAIReport = useAtomValue(isGeneratingAIReportAtom);

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
    <div className="relative flex h-full flex-col justify-between">
      <div className="h-full w-full flex-1 space-y-4">
        <p className="text-sm font-medium leading-5 text-muted-foreground">
          Choose a text style to create summaries for the active topics in your report.
        </p>
        <ScrollArea
          className={cn({
            "h-screen max-h-[calc(100vh-320px)] w-full": true,
          })}
        >
          <div className="h-full w-full flex-1 space-y-4">
            {!isGeneratingAIReport && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground">Summary text style</span>
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

            {!isGeneratingAIReport && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <span className="text-sm font-medium text-foreground">
                      Active indicators only
                    </span>
                    <Tooltip>
                      <TooltipTrigger>
                        <LuInfo className="h-full w-full" />
                      </TooltipTrigger>

                      <TooltipPortal>
                        <TooltipContent side="top" align="center">
                          <p className="max-w-80">
                            Include only active indicators in the generated summaries. Changes to
                            the indicators will require generating new summaries.
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

            {isGeneratingAIReport && (
              <div className="flex h-full w-full items-center justify-center py-20">
                <div className="flex w-full flex-col items-center justify-center space-y-2">
                  <span className="h-6 w-6 animate-spin text-blue-500">
                    <LuLoader2 className="h-6 w-6 text-foreground" />
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Generating AI summaries
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="relative flex w-full flex-col justify-end">
        <div className="flex items-start space-x-4 rounded-sm border border-border bg-blue-50 p-3">
          <CircleAlert className="text-alert h-4 w-4 shrink-0" />
          <p className="text-sm font-medium text-foreground">
            AI generated summaries can be inaccurate. We encourage you to verify the content
            carefully.
          </p>
        </div>
        <div className="mt-4 flex justify-between space-x-2">
          <Button variant="outline" className="w-full" onClick={handleClickClearAiSummary}>
            Clear
          </Button>
          <Button className="w-full space-x-2" onClick={handleClickAiGenerateSummary}>
            <LuSparkles />
            <span>Generate</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
