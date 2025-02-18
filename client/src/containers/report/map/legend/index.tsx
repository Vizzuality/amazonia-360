import { FC, useCallback, useMemo } from "react";

import { PopoverArrow } from "@radix-ui/react-popover";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuSettings2 } from "react-icons/lu";
import { TbChartCircles } from "react-icons/tb";

import { formatNumber } from "@/lib/formats";
import { useMeta } from "@/lib/grid";
import { useLocationGeometry } from "@/lib/location";
import { cn } from "@/lib/utils";

import {
  useSyncGridDatasets,
  useSyncGridFiltersSetUp,
  useSyncGridSelectedDataset,
  useSyncLocation,
} from "@/app/store";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const Legend: FC = () => {
  const [location] = useSyncLocation();
  const GEOMETRY = useLocationGeometry(location, {
    wkid: 4326,
  });

  const [gridDatasets] = useSyncGridDatasets();
  const [gridSelectedDataset, setGridSelectedDataset] = useSyncGridSelectedDataset();
  const [gridSetUpFilters, setGridSetUpFilters] = useSyncGridFiltersSetUp();

  const { META } = useMeta(GEOMETRY);

  const layersOptions = useMemo(
    () => [
      ...(gridDatasets?.map((d) => ({
        key: d,
        ...META?.datasets?.find((dataset) => dataset.var_name === d),
      })) || []),
      {
        key: "no-layer",
        label: "None",
      },
    ],
    [META, gridDatasets],
  );

  const GRID_SELECTED_DATASET = useMemo(
    () => layersOptions?.find((opt) => opt.key === gridSelectedDataset) || layersOptions[0],
    [gridSelectedDataset, layersOptions],
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
      <div className="flex items-center justify-between gap-1">
        <div
          className={cn({
            "px-4 py-2 text-sm text-foreground": true,
            "opacity-50": !gridDatasets.length || gridSelectedDataset === "no-layer",
          })}
        >
          {!!gridDatasets.length && GRID_SELECTED_DATASET.key !== "no-layer"
            ? GRID_SELECTED_DATASET.label
            : "Select layer to display"}
        </div>

        <div className="flex space-x-2 pr-2">
          <Popover>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger className="p-0">
                  <TbChartCircles className="h-6 w-6 stroke-blue-500" />
                </TooltipTrigger>
              </PopoverTrigger>

              <PopoverContent
                side="top"
                align="center"
                className="w-auto translate-x-[-15px] p-0"
                sideOffset={10}
              >
                <div className="flex w-72 flex-col space-y-2 rounded-lg bg-white px-4 py-2 shadow-md">
                  <div className="text-sm">Grid opacity</div>
                  <div className="py-2">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[gridSetUpFilters.opacity]}
                      minStepsBetweenThumbs={1}
                      onValueChange={onValueChange}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="flex w-full justify-between text-[10px] font-medium text-muted-foreground">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <PopoverArrow className="fill-background" width={10} height={5} />
              </PopoverContent>

              <TooltipPortal>
                <TooltipContent side="top" align="center">
                  Opacity: {gridSetUpFilters.opacity}%
                  <TooltipArrow className="fill-foreground" width={10} height={5} />
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </Popover>

          <Select value={gridSelectedDataset || gridDatasets[0]} onValueChange={onChangeDataset}>
            <Tooltip>
              <SelectTrigger
                className="border-none p-0 shadow-none focus:border-none focus:ring-0 focus:ring-transparent"
                hasArrow={false}
              >
                <TooltipTrigger asChild>
                  <LuSettings2 className="h-6 w-6 stroke-blue-500" />
                </TooltipTrigger>
              </SelectTrigger>

              <SelectContent
                side="top"
                sideOffset={10}
                align="start"
                className="no-scrollbar max-h-96 w-72 translate-x-[-6px] overflow-y-auto border-none shadow-md"
              >
                {layersOptions &&
                  layersOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key} className="cursor-pointer">
                      {opt.label}
                    </SelectItem>
                  ))}
              </SelectContent>

              <TooltipPortal>
                <TooltipContent align="center">
                  Select layer
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
              <div className="flex w-full justify-between text-[10px] font-medium text-muted-foreground">
                <span>{formatNumber(GRID_SELECTED_DATASET.legend.stats[0].min ?? 0)}</span>
                <span>{formatNumber(GRID_SELECTED_DATASET.legend.stats[0].max ?? 1)}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Legend;
