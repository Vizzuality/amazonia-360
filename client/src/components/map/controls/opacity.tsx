import { useState } from "react";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LucideBlend } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDebounce } from "rooks";

import { cn } from "@/lib/utils";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipArrow, TooltipContent } from "@/components/ui/tooltip";

const OpacityControl = ({
  value,
  onValueChange,
  triggerClassName,
}: {
  value: number;
  onValueChange: (value: number[]) => void;
  labelSlug?: string;
  triggerClassName?: string;
}) => {
  const t = useTranslations();
  const [opacity, setOpacity] = useState(value);
  const debouncedOnValueChange = useDebounce(onValueChange, 100);

  return (
    <Popover>
      <Tooltip>
        <PopoverTrigger
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-sm p-0 hover:bg-blue-100",
            triggerClassName,
          )}
        >
          <TooltipTrigger asChild>
            <LucideBlend className="h-4 w-4 stroke-blue-500" />
          </TooltipTrigger>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-auto p-0"
          sideOffset={5}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex w-72 flex-col space-y-2 rounded-lg bg-white px-4 py-2 shadow-md">
            <div className="text-sm">{t("grid-report-map-legend-layer-opacity")}</div>
            <div className="py-2">
              <Slider
                min={0}
                max={100}
                step={1}
                value={[opacity]}
                minStepsBetweenThumbs={1}
                onValueChange={(v) => {
                  setOpacity(v[0]);
                  debouncedOnValueChange(v);
                }}
                className="cursor-pointer"
              />
            </div>
            <div className="flex w-full justify-between text-[10px] font-medium text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* <PopoverArrow className="fill-background" width={10} height={5} /> */}
        </PopoverContent>

        <TooltipPortal>
          <TooltipContent align="center">
            {t("opacity")}: {value}%
            <TooltipArrow className="fill-foreground" width={10} height={5} />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Popover>
  );
};

export default OpacityControl;
