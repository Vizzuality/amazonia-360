import { PropsWithChildren, useState } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function Legend({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="bg-white border border-blue-100 rounded-3xl py-2 px-4"
    >
      <CollapsibleTrigger className="text-sm min-w-28 w-full flex justify-between items-center">
        <span>Legend</span>
        {open && <LuChevronDown className="w-4 h-4" />}
        {!open && <LuChevronUp className="w-4 h-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
