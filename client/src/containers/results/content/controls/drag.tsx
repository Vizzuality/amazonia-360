import { TooltipPortal } from "@radix-ui/react-tooltip";
import { LuMove } from "react-icons/lu";

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const MoveHandler = () => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="absolute -left-3 -top-2.5 z-10 rounded-full bg-primary p-2">
        <LuMove className="h-4 w-4 font-bold text-white" />
      </button>
    </TooltipTrigger>

    <TooltipPortal>
      <TooltipContent side="top" align="center">
        Move
        <TooltipArrow className="fill-foreground" width={10} height={5} />
      </TooltipContent>
    </TooltipPortal>
  </Tooltip>
);

export default MoveHandler;
