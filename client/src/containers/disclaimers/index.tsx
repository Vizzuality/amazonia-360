import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function Disclaimer({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <div className={cn("bg-amber-100 py-4 print:hidden", className)}>
      {children}
    </div>
  );
}
