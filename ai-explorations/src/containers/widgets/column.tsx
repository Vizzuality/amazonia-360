import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function WidgetsColumn({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("relative col-span-6 flex grow flex-col", className)}>{children}</div>;
}
