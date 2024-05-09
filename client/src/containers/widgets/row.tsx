"use client";

import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export default function WidgetsRow({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-2 items-stretch grow print:items-start print:grow-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
