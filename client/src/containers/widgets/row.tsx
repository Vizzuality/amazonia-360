"use client";

import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function WidgetsRow({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("grid grow grid-cols-12 items-stretch gap-2", className)}>{children}</div>
  );
}
