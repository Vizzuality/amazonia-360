import { PropsWithChildren } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { LuChevronUp } from "react-icons/lu";

export default function Legend({ children }: PropsWithChildren) {
  return (
    <Collapsible className="bg-white border border-blue-100 rounded-3xl py-2 px-4">
      <CollapsibleTrigger className="text-sm min-w-28 flex justify-between items-center">
        <span>Legend</span>
        <LuChevronUp className="w-4 h-4" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
