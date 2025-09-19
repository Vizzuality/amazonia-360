"use client";

import { TooltipPortal } from "@radix-ui/react-tooltip";
import { useTranslations } from "next-intl";
import { LuMove } from "react-icons/lu";

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MoveHandler = () => {
  const t = useTranslations();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="absolute -left-3 -top-2.5 z-10 rounded-full bg-primary p-2"
        >
          <LuMove className="h-4 w-4 font-bold text-white" />
        </button>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent side="top" align="center">
          {t("move")}
          <TooltipArrow className="fill-foreground" width={10} height={5} />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
};

export default MoveHandler;
