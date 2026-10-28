"use client";

import { createContext, PropsWithChildren, useContext } from "react";

import { UseQueryResult } from "@tanstack/react-query";
import { RefreshCw, SearchX, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import type { IndicatorEvidenceStatus } from "@/lib/ai";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
  const t = useTranslations();
  const { onRemove, retryable } = useContext(CardStateActionsContext);
  const status = getCardStateStatus(query, isEmpty);

  const handleRetry = () => {
    query.filter((q) => q.isError).forEach((q) => q.refetch());
  };

  if (status === "loading") {
    return <Skeleton data-testid="card-loader" className={className} />;
  }

  if (status === "ok") return <>{children}</>;

  const isError = status === "unavailable";
  const action = isError
    ? retryable && { label: t("card-state-retry"), icon: RefreshCw, onClick: handleRetry }
    : onRemove && {
        label: t(variant === "inline" ? "card-state-remove-short" : "card-state-remove"),
        icon: Trash2,
        onClick: onRemove,
      };
  const title = t(isError ? "card-state-error-title" : "card-state-no-data-title");

  if (variant === "inline") {
    return (
      <div
        data-testid={`card-state-${status}`}
        className="flex min-h-12 grow flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      >
        {isError ? (
          <TriangleAlert className="text-destructive h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <SearchX className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className={cn("font-medium", isError ? "text-destructive" : "text-muted-foreground")}>
          {title}
        </span>
        {action && (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="px-0"
            onClick={action.onClick}
            data-export-exclude
          >
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  const Icon = isError ? TriangleAlert : SearchX;

  return (
    <div
      data-testid={`card-state-${status}`}
      className="flex grow flex-col items-center justify-center gap-3 px-4 py-8 text-center"
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isError ? "bg-red-50" : "bg-blue-50",
        )}
      >
        <Icon
          className={cn("h-5 w-5", isError ? "text-destructive" : "text-muted-foreground")}
          aria-hidden
        />
      </div>
      <div className="space-y-1">
        <p className={cn("text-sm font-bold", isError ? "text-destructive" : "text-blue-900")}>
          {title}
        </p>
        <p className="text-muted-foreground max-w-64 text-sm">
          {t(isError ? "card-state-error-description" : "card-state-no-data-description")}
        </p>
      </div>
      {action && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="space-x-2"
          onClick={action.onClick}
          data-export-exclude
        >
          <action.icon className="h-4 w-4" aria-hidden />
          <span>{action.label}</span>
        </Button>
      )}
    </div>
  );
}
