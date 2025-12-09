import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function Disclaimer({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return <div className={cn("py-4 font-normal italic print:hidden", className)}>{children}</div>;
}
