"use client";
import { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

interface CardProps {
  padding?: boolean;
  className?: string;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="text-base font-semibold text-blue-600">{children}</h2>;
}

export function CardWidgetNumber({ children }: PropsWithChildren) {
  return <div className="font-bold text-4xl">{children}</div>;
}

export function Card({
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
