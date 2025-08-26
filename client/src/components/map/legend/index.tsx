import { PropsWithChildren, useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible";
import { useTranslations } from "next-intl";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function Legend({
  children,
  defaultOpen,
  actionButtons,
}: PropsWithChildren<{
  defaultOpen?: boolean;
  actionButtons?: React.ReactNode;
}>) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const t = useTranslations();
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-blue-100 bg-white px-4 py-2"
    >
      <div className="flex w-full min-w-32 items-center justify-between text-sm">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-sm">
          <span>{t("legend")}</span>
        </CollapsibleTrigger>
        <div className="flex items-center space-x-0">
          {actionButtons}

          <CollapsibleTrigger className="flex h-6 w-6 items-center justify-between rounded-sm px-1 text-sm hover:bg-blue-100">
            {open && <LuChevronDown className="h-4 w-4" />}
            {!open && <LuChevronUp className="h-4 w-4" />}
          </CollapsibleTrigger>
        </div>
      </div>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}
