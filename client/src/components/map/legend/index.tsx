import { PropsWithChildren, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function Legend({
  children,
  defaultOpen,
}: PropsWithChildren<{
  defaultOpen?: boolean;
}>) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const t = useTranslations();
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-blue-100 bg-white px-4 py-2"
    >
      <CollapsibleTrigger className="flex w-full min-w-28 items-center justify-between text-sm">
        <span>{t("legend")}</span>
        {open && <LuChevronDown className="h-4 w-4" />}
        {!open && <LuChevronUp className="h-4 w-4" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
