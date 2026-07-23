import { PropsWithChildren, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Legend({
  children,
  defaultOpen,
  interactive = true,
}: PropsWithChildren<{
  defaultOpen?: boolean;
  interactive?: boolean;
}>) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const t = useTranslations();

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="relative rounded-lg border border-blue-100 bg-white"
    >
      {open && interactive && (
        <CollapsibleTrigger asChild>
          <Button
            variant="default"
            size="xs"
            className="absolute right-2 bottom-full z-0 -translate-y-px rounded-b-none"
          >
            <LuChevronDown className="h-5 w-5" />
          </Button>
        </CollapsibleTrigger>
      )}

      {!open && interactive && (
        <CollapsibleTrigger className="px-4 py-2" asChild>
          <Button variant="ghost" size="sm" className="flex w-full items-center justify-between">
            {t("legend")}

            <LuChevronUp className="h-5 w-5" />
          </Button>
        </CollapsibleTrigger>
      )}

      <CollapsibleContent className="relative z-10">
        <ScrollArea className="max-h-96 overflow-auto">{children}</ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
