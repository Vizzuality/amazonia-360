import { FC, useCallback, useMemo } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useLocale, useTranslations } from "next-intl";
import { LuSettings2 } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { useMeta } from "@/lib/grid";
import { useGetH3Indicators } from "@/lib/indicators";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import {
  useSyncGridDatasets,
  useSyncGridFiltersSetUp,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import OpacityControl from "@/components/map/controls/opacity";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const GridLegend: FC = () => {
  const locale = useLocale();
  const t = useTranslations();
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const { data: H3IndicatorsData } = useGetH3Indicators(locale);

  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();
  const [gridSetUpFilters, setGridSetUpFilters] = useSyncGridFiltersSetUp();

  const { META } = useMeta(GEOMETRY);

  const OPTIONS = useMemo(() => {
    return [
      ...(gridDatasets?.map((d) => ({
        key: d,
        ...H3IndicatorsData?.find((i) => i.resource.column === d),
        ...META?.datasets.find((ds) => ds.var_name === d),
      })) || []),
      {
        key: "no-layer",
        name: t("none"),
      },
    ];
  }, [H3IndicatorsData, META, gridDatasets, t]);

  const GRID_SELECTED_DATASET = useMemo(
    () => OPTIONS?.find((opt) => opt.key === gridSelectedDataset) || OPTIONS[0],
    [gridSelectedDataset, OPTIONS],
  );

  const onValueChange = useCallback(
    (value: number[]) => {
      setGridSetUpFilters({
        ...gridSetUpFilters,
        opacity: value[0],
      });
    },
    [setGridSetUpFilters, gridSetUpFilters],
  );

  const onChangeDataset = useCallback(
    (e: string) => {
      setGridSelectedDataset(e);
    },

    [setGridSelectedDataset],
  );

  return (
    <div className="border-muted-background absolute bottom-16 right-4 flex w-72 flex-col space-y-1 rounded-lg border bg-white shadow-md">
      <div className="flex items-center justify-between gap-1 px-4 py-2">
        <div
          className={cn({
            "text-xs text-foreground": true,
            "opacity-50": !gridDatasets.length || gridSelectedDataset === "no-layer",
          })}
        >
          {!!gridDatasets.length && GRID_SELECTED_DATASET.key !== "no-layer"
            ? GRID_SELECTED_DATASET.name
            : t("grid-report-map-legend-select-layer-to-display")}

          {GRID_SELECTED_DATASET.unit && ` (${GRID_SELECTED_DATASET.unit})`}
        </div>

        <div className="flex items-center justify-end">
          <OpacityControl
            value={gridSetUpFilters.opacity}
            onValueChange={onValueChange}
            labelSlug="grid-report-map-legend-grid-opacity"
          />

          <Select value={gridSelectedDataset || gridDatasets[0]} onValueChange={onChangeDataset}>
            <Tooltip>
              <SelectTrigger
                className="flex h-6 w-6 items-center justify-center rounded-sm border-none p-0 shadow-none hover:bg-blue-100 focus:border-none focus:ring-0 focus:ring-transparent"
                hasArrow={false}
              >
                <TooltipTrigger asChild>
                  <LuSettings2 className="h-4 w-4 stroke-blue-500" />
                </TooltipTrigger>
              </SelectTrigger>

              <SelectContent
                side="top"
                sideOffset={10}
                align="start"
                className="no-scrollbar max-h-96 w-72 translate-x-[-6px] overflow-y-auto border-none shadow-md"
              >
                {OPTIONS &&
                  OPTIONS.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                      {opt.name}
                    </SelectItem>
                  ))}
              </SelectContent>

              <TooltipPortal>
                <TooltipContent align="center">
                  {t("grid-report-map-legend-select-layer")}
                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </Select>
        </div>
      </div>

      {!!GRID_SELECTED_DATASET && GRID_SELECTED_DATASET.key !== "no-layer" && (
        <div className="flex flex-col space-y-1 px-4 pb-2">
          {GRID_SELECTED_DATASET?.legend?.legend_type === "continuous" && (
            <>
              <div className="h-2 w-full rounded-full bg-viridis" />

              {"stats" in GRID_SELECTED_DATASET.legend && (
                <div className="flex w-full justify-between text-[10px] font-medium text-muted-foreground">
                  <span>{formatNumber(GRID_SELECTED_DATASET.legend.stats[0].min ?? 0)}</span>
                  <span>{formatNumber(GRID_SELECTED_DATASET.legend.stats[0].max ?? 1)}</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GridLegend;
