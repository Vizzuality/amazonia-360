"use client";
import { PropsWithChildren } from "react";

import Image from "next/image";

import { UseQueryResult } from "@tanstack/react-query";
import { LuInfo } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { DatasetIds } from "@/constants/datasets";

import Info from "@/containers/info";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardProps {
  padding?: boolean;
  className?: string;
}

export function CardHeader({
  className,
  children,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <header className={cn("flex items-start justify-between", className)}>
      {children}
    </header>
  );
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

export function CardInfo({
  ids,
  className,
}: {
  ids: DatasetIds[];
  className?: string;
}) {
  return (
    <Tooltip delayDuration={100}>
      <Dialog>
        <TooltipTrigger asChild>
          <DialogTrigger
            className={cn(
              "h-6 w-6 flex items-center justify-center",
              className,
            )}
          >
            <LuInfo className="text-blue-600" />
          </DialogTrigger>
        </TooltipTrigger>
        <DialogContent className="p-0">
          <Info ids={ids} />
        </DialogContent>
        <TooltipContent sideOffset={0}>
          About the data
          <TooltipArrow />
        </TooltipContent>
      </Dialog>
    </Tooltip>
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
  if (query.some((q) => q.isFetching)) {
    return <Skeleton data-testid="card-loader" {...rest} />;
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
    !query.some((q) => q.data && Array.isArray(q.data) && !!q.data.length)
  ) {
    return (
      <div className="flex flex-col justify-center items-center space-y-6 py-12 grow">
        <Image
          src={"/images/no-data.svg"}
          alt="No data"
          width={149}
          height={96}
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
        "p-6 rounded-2xl bg-white border border-blue-100 overflow-hidden flex flex-col grow break-inside-avoid",
        className,
      )}
    >
      {children}
    </div>
  );
}
