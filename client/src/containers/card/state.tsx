"use client";

import { createContext, PropsWithChildren, useContext } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import { RefreshCw, SearchX, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { IndicatorEvidenceStatus } from "@/lib/ai";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

export type CardStateStatus = "loading" | Exclude<IndicatorEvidenceStatus, "not_supported">;

/**
 * The card mirrors the evidence statuses so a card and the summary beside it can never disagree:
 * only a read that succeeded and found nothing is `no_coverage`.
 */
export const getCardStateStatus = (
  query: Pick<UseQueryResult<unknown, unknown>, "isFetching" | "isError">[],
  isEmpty: boolean,
): CardStateStatus => {
  if (query.some((q) => q.isFetching)) return "loading";
  if (query.some((q) => q.isError)) return "unavailable";
  if (isEmpty) return "no_coverage";

  return "ok";
};

type CardStateActions = {
  /** Absent wherever the card cannot be edited. */
  onRemove?: () => void;
  /** False on a printed page, where nothing can be retried. */
  retryable: boolean;
};

const CardStateActionsContext = createContext<CardStateActions>({ retryable: true });

export const CardStateActionsProvider = ({
  children,
  ...actions
}: PropsWithChildren<CardStateActions>) => (
  <CardStateActionsContext.Provider value={actions}>{children}</CardStateActionsContext.Provider>
);

type CardStateProps = PropsWithChildren<{
  query: UseQueryResult<unknown, unknown>[];
  isEmpty: boolean;
  /** `inline` fits the one-line height of a numeric card. */
  variant?: "block" | "inline";
  className?: string;
}>;

export function CardState({
  query,
  isEmpty,
  variant = "block",
  className,
  children,
}: CardStateProps) {
  const status = getCardStateStatus(query, isEmpty);

  if (status === "loading") {
    return <Skeleton data-testid="card-loader" className={className} />;
  }

  if (status === "ok") return <>{children}</>;

  return (
    <CardStateMessage
      status={status}
      variant={variant}
      onRetry={() => query.filter((q) => q.isError).forEach((q) => q.refetch())}
    />
  );
}

type CardStateMessageProps = {
  status: Exclude<CardStateStatus, "loading" | "ok">;
  variant?: "block" | "inline";
  onRetry: () => void;
  className?: string;
};

export function CardStateMessage({
  status,
  variant = "block",
  onRetry,
  className,
}: CardStateMessageProps) {
  const t = useTranslations();
  const { onRemove, retryable } = useContext(CardStateActionsContext);

  const isError = status === "unavailable";
  const remove = onRemove && {
    label: t(variant === "inline" ? "card-state-remove-short" : "card-state-remove"),
    icon: Trash2,
    onClick: onRemove,
  };
  const retry = isError &&
    retryable && { label: t("card-state-retry"), icon: RefreshCw, onClick: onRetry };
  const actions = [retry, remove].filter((a) => !!a);
  const title = t(isError ? "card-state-error-title" : "card-state-no-data-title");

  const Icon = isError ? TriangleAlert : SearchX;
  const isInline = variant === "inline";

  if (!isInline) {
    return (
      // A chart can be resized down to a single grid row, so the message lays itself out from the
      // card's size: a row while it is short, a centred stack once there is room for one.
      <div
        data-testid={`card-state-${status}`}
        className={cn("@container-[size] flex min-h-16 grow", className)}
      >
        <div className="flex size-full items-center justify-center gap-3 overflow-hidden p-2 [@container(min-height:11rem)]:flex-col [@container(min-height:11rem)]:p-4 [@container(min-height:11rem)]:text-center">
          <div
            className={cn(
              "hidden h-8 w-8 shrink-0 items-center justify-center rounded-full @[12rem]:flex [@container(min-height:11rem)]:h-10 [@container(min-height:11rem)]:w-10",
              isError ? "bg-red-50" : "bg-blue-50",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 [@container(min-height:11rem)]:h-5 [@container(min-height:11rem)]:w-5",
                isError ? "text-destructive" : "text-muted-foreground",
              )}
              aria-hidden
            />
          </div>
          <div className="min-w-0 space-y-1 [@container(max-height:11rem)]:grow">
            <p
              title={title}
              className={cn(
                "line-clamp-2 text-sm leading-tight font-bold",
                isError ? "text-destructive" : "text-blue-900",
              )}
            >
              {title}
            </p>
            <p className="text-muted-foreground hidden max-w-md text-sm @lg:block [@container(min-height:11rem)_and_(min-width:16rem)]:block">
              {t(isError ? "card-state-error-description" : "card-state-no-data-description")}
            </p>
          </div>
          {!!actions.length && (
            <div className="flex shrink-0 flex-wrap justify-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={action.onClick}
                  aria-label={action.label}
                  title={action.label}
                  data-export-exclude
                >
                  <action.icon className="h-4 w-4" aria-hidden />
                  <span className="hidden @[16rem]:inline">{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={`card-state-${status}`}
      className={cn("flex min-h-12 grow items-center gap-2", className)}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isError ? "bg-red-50" : "bg-blue-50",
        )}
      >
        <Icon
          className={cn("h-4 w-4", isError ? "text-destructive" : "text-muted-foreground")}
          aria-hidden
        />
      </div>
      {/* A numeric card is a fixed one-row tile, so the inline variant drops the description. */}
      <p
        title={title}
        className={cn(
          "line-clamp-2 min-w-0 grow text-sm leading-tight font-bold",
          isError ? "text-destructive" : "text-blue-900",
        )}
      >
        {title}
      </p>
      {!!actions.length && (
        <div className="flex shrink-0 gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={action.onClick}
              aria-label={action.label}
              title={action.label}
              data-export-exclude
            >
              <action.icon className="h-4 w-4" aria-hidden />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CardStateMapLoading({ className }: { className?: string }) {
  const t = useTranslations();

  return (
    <div
      data-testid="card-state-map-loading"
      className={cn(
        "flex grow flex-col items-center justify-center gap-2 px-4 py-8 text-center",
        className,
      )}
    >
      <Spinner className="text-primary h-6 w-6" />
      <p className="text-sm font-medium text-blue-900">{t("map-state-loading-title")}</p>
      <p className="text-muted-foreground text-sm">{t("map-state-loading-description")}</p>
    </div>
  );
}
