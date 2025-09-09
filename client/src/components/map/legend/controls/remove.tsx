"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuX } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function RemoveControl({ onClick }: { onClick?: () => void }) {
  const t = useTranslations();

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger
        className={cn("flex cursor-pointer items-center justify-center p-0.5")}
        onClick={onClick}
      >
        <LuX className="h-4 w-4 text-foreground" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent sideOffset={0} className="max-w-72">
          {t("delete")}
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}
