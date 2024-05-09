import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function WidgetsColumn({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "col-span-6 print:block flex flex-col relative grow print:grow-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
