import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function WidgetsColumn({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("col-span-6 flex flex-col relative", className)}>
      {children}
    </div>
  );
}
