"use client";
import { PropsWithChildren } from "react";

import Image from "next/image";

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

export function CardContent({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mt-2 flex flex-col grow", className)}>{children}</div>
  );
}

export function CardLoader({
  query,
  children,
  ...rest
}: {
  query: UseQueryResult<unknown, unknown>[];
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  if (!query.every((q) => q.data) || query.some((q) => q.isFetching)) {
    return <Skeleton {...rest} />;
  }

  return <>{children}</>;
}

export function CardNoData({
  query,
  children,
}: {
  query: UseQueryResult<unknown, unknown>[];
  children: React.ReactNode;
}) {
  if (
    query.every((q) => q.isFetched) &&
    !query.every((q) => q.data && Array.isArray(q.data) && !!q.data.length)
  ) {
    return (
      <div className="flex flex-col justify-center items-center space-y-6 py-12 grow">
        <Image
          src={"/images/no-data.png"}
          alt="No data"
          width={141}
          height={94}
        />
        <p className="text-sm text-blue-900 font-medium text-center">
          No results for this location at the moment. <br /> Feel free to adjust
          your search criteria or check back later!
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
export function CardWidgetNumber({
  value,
  subvalue,
  unit,
}: {
  value: string | number | null;
  subvalue?: string | number | null;
  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-end space-x-2">
        <span className="font-bold text-4xl text-blue-600">{value}</span>

        {!!unit && (
          <span className="text-xs font-medium text-gray-500 relative bottom-1.5">
            {unit}
          </span>
        )}
      </div>

      {subvalue && <p className="text-xs text-foreground">{subvalue}</p>}
    </div>
  );
}

export function Card({ className, children }: PropsWithChildren<CardProps>) {
  return (
    <div
      className={cn(
        "p-6 rounded-2xl bg-white border border-blue-200 overflow-hidden flex flex-col grow",
        className,
      )}
    >
      {children}
    </div>
  );
}
