"use client";
import { PropsWithChildren } from "react";

import { UseQueryResult } from "@tanstack/react-query";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

interface CardProps {
  padding?: boolean;
  className?: string;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="text-base font-semibold text-blue-600">{children}</h2>;
}

export function CardLoader({
  query,
  children,
  ...rest
}: {
  query: UseQueryResult<unknown, unknown>;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!query.data || query.isFetching) {
    return <Skeleton {...rest} />;
  }

  return <>{children}</>;
}

export function CardWidgetNumber({
  value,
  unit,
}: {
  value: string | number | null;
  unit: string;
}) {
  return (
    <div className="flex items-end space-x-2">
      <span className="font-bold text-4xl text-blue-600">{value}</span>
      <span className="text-xs font-medium text-gray-500 relative bottom-1.5">
        {unit}
      </span>
    </div>
  );
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white border border-blue-100 overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
