"use client";

import { useTranslations } from "next-intl";

import { useSyncIndicators } from "@/app/store";

import { Button } from "@/components/ui/button";

export default function IndicatorsFooter() {
  const t = useTranslations();
  const [indicators, setIndicators] = useSyncIndicators();

  const handleClear = () => {
    setIndicators(null);
  };

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" className="invisible">
        Expand all
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleClear}
        disabled={!indicators?.length}
        className="space-x-1"
      >
        <span>{t("grid-sidebar-grid-filters-button-clear-selection")}</span>
        <span>({indicators?.length ?? 0})</span>
      </Button>
    </div>
  );
}
