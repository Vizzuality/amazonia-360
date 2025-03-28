import { TooltipPortal } from "@radix-ui/react-tooltip";
import { Trash2 } from "lucide-react";

import { VisualizationTypes } from "@/app/local-api/indicators/route";

import { Tooltip, TooltipArrow, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type DeleteHandlerProps = {
  indicatorId: number;
  type: VisualizationTypes;
  onClick: (indicatorId: number, type: VisualizationTypes) => void;
};

const DeleteHandler = ({ indicatorId, type, onClick }: DeleteHandlerProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        id={`${indicatorId}`}
        type="button"
        className="absolute -right-3 -top-2.5 z-10 rounded-full bg-primary p-2"
        onClick={() => {
          onClick(indicatorId, type);
        }}
      >
        <Trash2 className="h-4 w-4 font-bold text-white" />
      </button>
    </TooltipTrigger>

    <TooltipPortal>
      <TooltipContent side="top" align="center">
        Delete
        <TooltipArrow className="fill-foreground" width={10} height={5} />
      </TooltipContent>
    </TooltipPortal>
  </Tooltip>
);

export default DeleteHandler;
