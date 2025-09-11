"use client";

import { ChangeEvent, useMemo } from "react";
import { useCallback, useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { LuSettings2 } from "react-icons/lu";

import { useGetH3Indicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import {
  useSyncGridDatasets,
  useSyncGridTableSettings,
  useSyncGridSelectedDataset,
} from "@/app/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GridTableSetup() {
  const t = useTranslations();
  const locale = useLocale();

  const RANKING_DIRECTION = [
    {
      key: "asc",
      label: t("grid-sidebar-grid-filters-ranking-set-up-order-by-ascending"),
    },
    {
      key: "desc",
      label: t("grid-sidebar-grid-filters-ranking-set-up-order-by-descending"),
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  const [gridDatasets, setGridDatasets] = useSyncGridDatasets();
  const [, setGridSelectedDataset] = useSyncGridSelectedDataset();
  const [gridSetup, setGridTableSettings] = useSyncGridTableSettings();
  const [selectedDirection, setDirection] = useState<"asc" | "desc">(gridSetup.direction ?? "desc");
  const [selectedDataset, setDataset] = useState<string>(gridDatasets[0]);
  const [selectedLimit, setSelectedLimit] = useState<number>(gridSetup.limit ?? 10);

  const { data: h3IndicatorsData } = useGetH3Indicators(undefined, locale);

  const OPTIONS = useMemo(() => {
    if (!h3IndicatorsData) return [];

    return h3IndicatorsData
      .map((indicator) => ({
        key: indicator.resource.column,
        label: indicator.name,
      }))
      .filter((indicator) => gridDatasets.includes(indicator.key));
  }, [h3IndicatorsData, gridDatasets]);

  const handleRankingChange = useCallback(
    (e: string) => {
      setDataset(e);
    },
    [setDataset],
  );

  const handleDirectionChange = useCallback((e: "asc" | "desc") => {
    setDirection(e);
  }, []);

  const onInputChange = useCallback(
    (v: ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(v.target.value);
      setSelectedLimit(value);
    },
    [setSelectedLimit],
  );

  const handleFilters = useCallback(() => {
    if (selectedDataset) {
      const updatedOrder = [selectedDataset, ...gridDatasets.filter((d) => d !== selectedDataset)];
      setGridDatasets(updatedOrder);
      setGridSelectedDataset(selectedDataset);
    }

    if (selectedDirection) {
      setGridTableSettings((prev) => ({
        ...prev,
        direction: selectedDirection,
      }));
    }

    if (selectedLimit) {
      setGridTableSettings((prev) => ({
        ...prev,
        limit: selectedLimit,
      }));
    }
    setIsOpen(false);
  }, [
    selectedDataset,
    selectedDirection,
    selectedLimit,
    gridDatasets,
    setGridDatasets,
    setGridTableSettings,
    setGridSelectedDataset,
  ]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={!gridDatasets.length}
        className={cn({
          "duration-400 flex shrink-0 items-center justify-center rounded-lg px-2.5 py-2.5 transition-colors ease-in-out":
            true,
          "hover:bg-blue-100": gridDatasets.length,
          "opacity-50": !gridDatasets.length,
        })}
        asChild
      >
        <Button variant="ghost" size="sm" className="gap-2">
          <span>Sort</span>
          <LuSettings2 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        alignOffset={-26}
        sideOffset={32}
        align="start"
        className="w-auto max-w-80 bg-background p-2"
      >
        <div className="space-y-4 p-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-popover-foreground">
              {t("grid-sidebar-grid-filters-ranking-set-up-title")}
            </h2>
            <span className="text-sm text-muted-foreground">
              {t("grid-sidebar-grid-filters-ranking-set-up-description")}
            </span>
          </div>
          <div className="w-full gap-2 overflow-hidden">
            <span className="text-sm text-foreground">
              {t("grid-sidebar-grid-filters-ranking-set-up-order-by")}
            </span>
            <div className="flex gap-2">
              <Select value={selectedDataset} onValueChange={handleRankingChange}>
                <SelectTrigger className="h-10 w-full max-w-36 rounded-sm">
                  <SelectValue className="text-sm">
                    <p className="flex-grow truncate md:max-w-80 lg:max-w-none">
                      {OPTIONS?.find((opt) => opt.key === selectedDataset)?.label ||
                        "selectedDataset"}
                    </p>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
                  {OPTIONS &&
                    OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={selectedDirection} onValueChange={handleDirectionChange}>
                <SelectTrigger className="h-10 w-32 rounded-sm">
                  <SelectValue className="text-sm">
                    <p className="w-fit max-w-64 flex-1 truncate md:max-w-80 lg:max-w-none">
                      {RANKING_DIRECTION.find((opt) => opt.key === selectedDirection)?.label || ""}
                    </p>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="no-scrollbar max-h-96 overflow-y-auto border-none shadow-md">
                  {RANKING_DIRECTION &&
                    RANKING_DIRECTION.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="gap-2">
            <Label htmlFor="cells-number" className="text-sm text-foreground">
              {t("grid-sidebar-grid-filters-ranking-set-up-max-number-cell")}
            </Label>
            <Input
              placeholder={`${gridSetup?.limit ?? 10}`}
              id="cell-number"
              type="number"
              min={0}
              className="h-10"
              onChange={onInputChange}
            />
            <span className="text-sm text-muted-foreground">
              {t("grid-sidebar-grid-filters-ranking-set-up-max-number-cell-note")}.
            </span>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleFilters}>
              {t("grid-sidebar-grid-filters-ranking-set-up-button-apply")}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
