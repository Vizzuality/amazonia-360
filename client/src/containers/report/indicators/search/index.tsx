"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { Indicator } from "@/types/indicator";

import { useSyncIndicators } from "@/app/store";

import { Search } from "@/components/ui/search";
import { Switch } from "@/components/ui/switch";

type Option = Indicator & {
  label: string;
  value: string;
  key: string;
  active?: boolean;
  sourceIndex: number;
  group: {
    id: number;
    label: string;
  };
};

export default function IndicatorsSearch({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [indicators, setIndicators] = useSyncIndicators();

  const queryIndicators = useGetDefaultIndicators({ locale });

  const INDICATORS = useMemo(() => {
    return queryIndicators.data
      ?.filter((indicator) => indicator.topic.id !== 0)
      ?.map((indicator) => ({
        ...indicator,
        label: indicator.name ?? "",
        value: `${indicator.id}`,
        key: `${indicator.id}`,
        active: !!indicators?.includes(indicator.id),
        group: {
          id: indicator.topic.id,
          label: indicator.topic.name,
        },
      })) as Option[];
  }, [indicators, queryIndicators.data]);

  const OPTIONS = useMemo(() => {
    if (search) {
      return (
        INDICATORS?.filter(
          (o) =>
            o.key.toLowerCase().includes(search.toLowerCase()) ||
            o.label?.toLowerCase().includes(search.toLowerCase()) ||
            o.topic.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.subtopic.name?.toLowerCase().includes(search.toLowerCase()),
        ) || []
      );
    }
    return INDICATORS || [];
  }, [search, INDICATORS]);

  const handleSearch = useCallback(
    (value: string) => {
      setOpen(true);
      setSearch(value);
    },
    [setSearch],
  );

  const handleSelect = useCallback(
    (value: Option | null) => {
      if (!value) {
        setOpen(false);
        setSearch("");
        return;
      }

      const v = Number(value.value);

      setIndicators((prev) => {
        if (prev?.includes(v)) {
          return prev.filter((i) => i !== v);
        }
        return [...(prev || []), v];
      });
    },
    [setSearch, setOpen, setIndicators],
  );

  return (
    <div className={cn({ "w-full": true, [`${className}`]: !!className })}>
      <Search
        value={search}
        open={open}
        placeholder={`${t("grid-sidebar-report-location-filters-search")}...`}
        options={OPTIONS}
        {...queryIndicators}
        onChange={handleSearch}
        onSelect={handleSelect}
        size="sm"
      >
        {(o) => (
          <div
            className={cn({
              "flex w-full cursor-pointer items-start justify-between gap-2 py-0.5 text-start text-xs":
                true,
            })}
            role="button"
            aria-disabled={false}
          >
            <span>{o.label}</span>
            <Switch className="h-4 w-8" checked={o.active} />
          </div>
        )}
      </Search>
    </div>
  );
}
