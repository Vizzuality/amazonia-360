"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { useSyncIndicators, useSyncIndicatorsSettings } from "@/app/(frontend)/store";

import { IndicatorScopeBadge } from "@/containers/indicators/scope-badge";
import Info from "@/containers/info";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type IndicatorsItemProps = Indicator;

export default function IndicatorsItem({
  id,
  name,
  description_short,
  country,
}: IndicatorsItemProps) {
  const [indicators, setIndicators] = useSyncIndicators();
  const [, setIndicatorsSettings] = useSyncIndicatorsSettings();

  const handleChangeIndicator = (checked: boolean) => {
    setIndicators((prev) => {
      const p = prev ?? [];

      if (checked) {
        return [...p, id];
      } else {
        return p.filter((indicator) => indicator !== id);
      }
    });

    setIndicatorsSettings((prev) => {
      const current = { ...prev };
      if (!checked) {
        delete current[id];
      }
      return current;
    });
  };

  return (
    <div
      key={id}
      className={cn(
        "flex h-full w-full grow cursor-pointer items-center justify-between gap-0.5 overflow-hidden rounded-lg bg-white py-0.5 pr-2 pl-1 text-left transition-colors duration-300 ease-in-out hover:bg-blue-50",
      )}
    >
      <button
        type="button"
        className={cn(
          "text-foreground flex grow items-center gap-2 rounded-xs text-left text-xs leading-4 font-medium",
        )}
        onClick={() => handleChangeIndicator(!indicators?.includes(id))}
      >
        <IndicatorScopeBadge country={country} />
        <span>{name}</span>
      </button>
      <div className="flex items-center gap-0.5">
        <Tooltip delayDuration={100}>
          <Dialog>
            <TooltipTrigger asChild>
              <DialogTrigger
                className={cn("flex size-6 cursor-pointer items-center justify-center rounded")}
              >
                <LuInfo className="text-foreground h-4 w-4" />
              </DialogTrigger>
            </TooltipTrigger>
            <DialogContent className="max-w-2xl p-0">
              <DialogTitle className="sr-only">{description_short}</DialogTitle>
              <Info ids={[id]} />
              <DialogClose />
            </DialogContent>
            <TooltipPortal>
              <TooltipContent sideOffset={0} className="max-w-72">
                {description_short}
                <TooltipArrow />
              </TooltipContent>
            </TooltipPortal>
          </Dialog>
        </Tooltip>

        <Switch
          className="h-4 w-8"
          checked={!!indicators && indicators?.includes(id)}
          onCheckedChange={handleChangeIndicator}
        />
      </div>
    </div>
  );
}
