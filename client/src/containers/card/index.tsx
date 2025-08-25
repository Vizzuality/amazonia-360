"use client";

import { PropsWithChildren, MouseEvent } from "react";

import ReactMarkdown from "react-markdown";

import Image from "next/image";

import { DialogTitle } from "@radix-ui/react-dialog";
import { TooltipPortal } from "@radix-ui/react-tooltip";
import { UseQueryResult } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { LuInfo, LuPen, LuDownload } from "react-icons/lu";

import { formatNumber } from "@/lib/formats";
import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";
import { usePostWebshotWidgetsMutation } from "@/lib/webshot";

import { Indicator, VisualizationTypes } from "@/app/local-api/indicators/route";

import Info from "@/containers/info";

import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardProps {
  padding?: boolean;
  className?: string;
}

const DOWNLOAD_FORMATS = [
  { label: "PNG", value: "png" },
  // { label: "JPEG", value: "jpeg" },
  // { label: "SVG", value: "svg+xml" },
];

export function CardHeader({
  className,
  children,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <header className={cn("flex h-6 items-start justify-between", className)}>{children}</header>
  );
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="line-clamp-1 text-base font-semibold text-blue-600">{children}</h2>;
}

export function CardContent({ className, children }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("mt-2 flex h-full grow flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function CardSettings({
  id,
  onClick,
}: PropsWithChildren<{ id: Indicator["id"]; onClick?: (e: MouseEvent<HTMLElement>) => void }>) {
  const t = useTranslations();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          id={`${id}`}
          type="button"
          aria-label={t("edit-indicator")}
          onClick={onClick}
          className="space-x-2"
        >
          <LuPen className="inline-block h-4 w-4" />
          <span>{t("edit-indicator")}</span>
        </button>
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent sideOffset={0}>
          {t("edit-indicator")}
          <TooltipArrow />
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

export function CardDownload({
  id,
  visualizationType,
}: PropsWithChildren<{ id: Indicator["id"]; visualizationType: VisualizationTypes }>) {
  const locale = useLocale();
  const t = useTranslations();

  const postWebshotWidgetsMutation = usePostWebshotWidgetsMutation();

  return (
    <div className="flex flex-col space-y-1">
      <span className="text-muted-foreground first-letter:capitalize">
        {t("download-indicator")}
      </span>
      <ul>
        {DOWNLOAD_FORMATS.map((format) => (
          <li className="py-1.5" key={format.value}>
            <button
              type="button"
              className="flex items-center"
              onClick={() => {
                postWebshotWidgetsMutation.mutate({
                  pagePath: `/${locale}/webshot/widgets/${id}/${visualizationType}`,
                  outputFileName: `indicator-${id}.${format.value.toLowerCase()}`,
                  params: {},
                });
              }}
            >
              <LuDownload className="mr-2 inline-block h-4 w-4" />
              {format.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CardPopover({
  id,
  visualizationType,
  onClick,
}: PropsWithChildren<{
  id: Indicator["id"];
  visualizationType: VisualizationTypes;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
}>) {
  const t = useTranslations();
  return (
    <DropdownMenu>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <button
              aria-label={t("indicator-menu")}
              type="button"
              className="h-8 w-8 rounded-sm hover:bg-blue-100"
            >
              <span className="h-4 w-4">⋮</span>
            </button>
          </TooltipTrigger>
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuContent side="left" align="start" sideOffset={6}>
            <DropdownMenuGroup className="px-2 py-1.5 text-sm text-popover-foreground">
              <CardSettings id={id} onClick={onClick} />
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-border" />
            <DropdownMenuGroup className="px-2 py-1.5 text-sm text-popover-foreground">
              <CardDownload id={id} visualizationType={visualizationType} />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenuPortal>
        <TooltipPortal>
          <TooltipContent sideOffset={0}>
            {t("indicator-menu")}
            <TooltipArrow />
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </DropdownMenu>
  );
}

export function CardControls({ children }: PropsWithChildren) {
  return (
    <div className="relative -top-1 flex items-center space-x-0">
      <TooltipProvider delayDuration={500}>{children}</TooltipProvider>
    </div>
  );
}

export function CardInfo({ ids, className }: { ids: Indicator["id"][]; className?: string }) {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(ids[0], locale);

  if (!indicator) return null;

  const { description_short } = indicator;

  if (!description_short) return null;

  return (
    <Tooltip>
      <Dialog>
        <TooltipTrigger asChild>
          <DialogTrigger
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-sm hover:bg-blue-100",
              className,
            )}
          >
            <LuInfo className="text-blue-600" />
          </DialogTrigger>
        </TooltipTrigger>
        <DialogContent className="max-w-2xl p-0">
          <DialogTitle className="sr-only">{description_short}</DialogTitle>
          <Info ids={ids} />
          <DialogClose />
        </DialogContent>
        <TooltipPortal>
          <TooltipContent sideOffset={0} className="max-w-72">
            {description_short}
            <TooltipArrow />
          </TooltipContent>
        </TooltipPortal>
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
  const t = useTranslations();
  if (
    query.every((q) => q.isFetched) &&
    !query.some((q) => q.data && Array.isArray(q.data) && !!q.data.length)
  ) {
    return (
      <div className="flex grow flex-col items-center justify-center space-y-6 py-12">
        <Image src={"/images/no-data.svg"} alt="No data" width={149} height={96} />
        <div className="text-center text-sm font-medium text-blue-900">
          <ReactMarkdown>{t("card-no-results")}</ReactMarkdown>
        </div>
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
        <span className="text-4xl font-bold text-blue-500">
          {typeof value === "number" ? formatNumber(value) : value}
        </span>

        {!!unit && (
          <span className="relative bottom-1.5 text-xs font-medium text-gray-300">{unit}</span>
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
        "flex h-full grow break-inside-avoid flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
