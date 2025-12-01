"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { LuInfo, LuSparkles } from "react-icons/lu";

import { ContextDescriptionType } from "@/types/generated/api.schemas";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISummaryFormProps {
  onSubmit?: (values: { tone: ContextDescriptionType; onlyActiveIndicators: boolean }) => void;
  onClose?: () => void;
}

export const AISummaryForm = ({ onSubmit, onClose }: AISummaryFormProps) => {
  const t = useTranslations();

  const form = useForm({
    defaultValues: {
      tone: "Normal" as ContextDescriptionType,
      onlyActiveIndicators: true,
    },
    onSubmit: async ({ value }) => {
      onSubmit?.(value);
      onClose?.();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">AI settings</h3>
        <p className="text-sm text-muted-foreground">
          {t("report-results-sidebar-ai-summaries-description")}
        </p>
      </div>

      {/* Tone Section */}
      <form.Field name="tone">
        {(field) => (
          <div className="space-y-3">
            <Label className="text-base font-medium">Tone</Label>
            <RadioGroup
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as ContextDescriptionType)}
              className="gap-3"
            >
              {/* Standard */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Normal" id="Normal" />
                  <Label htmlFor="Normal" className="cursor-pointer font-normal">
                    {t("report-results-sidebar-ai-summaries-audience-normal-title")}
                  </Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <LuInfo className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-48">
                      <p>{t("report-results-sidebar-ai-summaries-audience-normal-description")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Executive */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Short" id="Short" />
                  <Label htmlFor="Short" className="cursor-pointer font-normal">
                    {t("report-results-sidebar-ai-summaries-audience-short-title")}
                  </Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <LuInfo className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-48">
                      <p>{t("report-results-sidebar-ai-summaries-audience-short-description")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Comprehensive */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Long" id="Long" />
                  <Label htmlFor="Long" className="cursor-pointer font-normal">
                    {t("report-results-sidebar-ai-summaries-audience-long-title")}
                  </Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <LuInfo className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-48">
                      <p>{t("report-results-sidebar-ai-summaries-audience-long-description")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </RadioGroup>
          </div>
        )}
      </form.Field>

      {/* Focus Section */}
      <form.Field name="onlyActiveIndicators">
        {(field) => (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <span className="text-sm font-medium text-foreground">
                  {t("report-results-sidebar-ai-summaries-checkbox-active-indicators")}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <LuInfo className="h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-80">
                      <p>
                        {t("report-results-sidebar-ai-summaries-checkbox-active-indicators-info")}
                      </p>
                      <TooltipArrow className="fill-primary" width={10} height={5} />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                className="h-4 w-8"
                checked={field.state.value}
                onCheckedChange={(checked) => field.handleChange(checked)}
              />
            </div>
          </div>
        )}
      </form.Field>

      <p className="text-xs text-muted-foreground">
        {t("report-results-sidebar-ai-summaries-disclaimer")}
      </p>

      {/* Submit Button */}
      <Button type="submit" className="w-full gap-2">
        <LuSparkles />
        <span>Generate Summary</span>
      </Button>
    </form>
  );
};
