"use client";
import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
  padding?: boolean;
  className?: string;
}

export default function Card({
  padding = true,
  className,
  children,
}: PropsWithChildren<CardProps>) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white border border-blue-100 overflow-hidden",
        {
          "p-0": !padding,
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
