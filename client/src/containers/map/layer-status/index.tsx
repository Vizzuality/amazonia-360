"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { SearchX, TriangleAlert } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useGetIndicatorsId } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import {
  exploreLayerAttemptsAtom,
  exploreLayerStatusesAtom,
  ExploreLayerStatus,
} from "@/containers/map/layer-status/store";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const pill =
  "pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm shadow-xs";

export default function LayerStatus({ className }: { className?: string }) {
  const t = useTranslations();
  const statuses = useAtomValue(exploreLayerStatusesAtom);

  const entries = Object.entries(statuses) as [string, ExploreLayerStatus][];
  const isLoading = entries.some(([, status]) => status === "loading");
  const flagged = entries.filter(
    ([, status]) => status === "no_coverage" || status === "unavailable",
  );

  if (!isLoading && !flagged.length) return null;

  return (
    <div className={cn("pointer-events-none flex flex-col items-end gap-2", className)}>
      {isLoading && (
        <div data-testid="map-layer-loading" className={cn(pill, "bg-background text-blue-900")}>
          <Spinner className="text-primary" />
          <span>{t("map-state-loading-title")}</span>
        </div>
      )}
      {flagged.map(([id, status]) => (
        <LayerStatusPill
          key={id}
          id={Number(id)}
          status={status as Exclude<ExploreLayerStatus, "loading" | "ok">}
        />
      ))}
    </div>
  );
}

function LayerStatusPill({
  id,
  status,
}: {
  id: Indicator["id"];
  status: Exclude<ExploreLayerStatus, "loading" | "ok">;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);
  const setAttempts = useSetAtom(exploreLayerAttemptsAtom);

  const name = indicator?.name ?? "";

  if (status === "no_coverage") {
    return (
      <div
        data-testid={`map-layer-no_coverage-${id}`}
        className={cn(pill, "bg-background text-blue-900")}
      >
        <SearchX className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
        <span>{t("map-layer-state-no-data", { name })}</span>
      </div>
    );
  }

  return (
    <div
      data-testid={`map-layer-unavailable-${id}`}
      role="alert"
      className={cn(pill, "border-destructive text-destructive bg-red-50")}
    >
      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
      <span>{t("map-layer-state-error", { name })}</span>
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="bg-background text-blue-900"
        onClick={() => setAttempts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))}
      >
        {t("card-state-retry")}
      </Button>
    </div>
  );
}
