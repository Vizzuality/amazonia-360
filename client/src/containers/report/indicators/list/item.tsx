"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { useSyncIndicators } from "@/app/store";

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

export default function IndicatorsItem({ id, name, description_short }: IndicatorsItemProps) {
  const [indicators, setIndicators] = useSyncIndicators();

  const handleChangeIndicator = (checked: boolean) => {
    setIndicators((prev) => {
      const p = prev ?? [];

      if (checked) {
        return [...p, id];
      } else {
        return p.filter((indicator) => indicator !== id);
      }
    });
  };

  return (
    <div
      key={id}
      className={cn(
        "flex h-full w-full grow cursor-pointer items-center justify-between space-x-2.5 overflow-hidden rounded-sm bg-white text-left",
      )}
    >
      <button
        className={cn(
          "flex grow items-center space-x-2.5 rounded-sm p-1 pr-2 transition-all duration-300 ease-in-out hover:bg-blue-50",
        )}
        onClick={() => handleChangeIndicator(!indicators?.includes(id))}
      >
        <div className="flex flex-col items-start justify-start space-y-1">
          <span className="text-sm font-medium text-gray-400 transition-none">{name}</span>
        </div>
      </button>
      <div className="flex items-center gap-1">
        <Tooltip delayDuration={100}>
          <Dialog>
            <TooltipTrigger asChild>
              <DialogTrigger
                className={cn("flex cursor-pointer items-center justify-center p-0.5")}
              >
                <LuInfo className="h-4 w-4 text-foreground" />
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
