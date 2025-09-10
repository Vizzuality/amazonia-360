"use client";

import { useCallback, useMemo, useState } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetDefaultIndicators } from "@/lib/indicators";
import { cn } from "@/lib/utils";

import { useSyncIndicators } from "@/app/store";

import { Search } from "@/components/ui/search";

type Option = {
  label: string;
  value: string;
  key: string;
  active?: boolean;
  sourceIndex: number;
};

export default function IndicatorsSearch({ className }: { className?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [, setIndicators] = useSyncIndicators();

  const queryIndicators = useGetDefaultIndicators(undefined, locale);

  const INDICATORS = useMemo(() => {
    return queryIndicators.data?.map((indicator) => ({
      label: indicator.name ?? "",
      value: `${indicator.id}`,
      key: `${indicator.id}`,
    })) as Option[];
  }, [queryIndicators.data]);

  const OPTIONS = useMemo(() => {
    if (search) {
      return (
        INDICATORS?.filter(
          (o) =>
            o.label?.toLowerCase().includes(search.toLowerCase()) ||
            o.key.toLowerCase().includes(search.toLowerCase()),
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
              "flex w-full cursor-pointer items-start justify-between gap-2 py-1 text-start text-xs":
                true,
              "pointer-events-none opacity-50": o.active,
            })}
            role="button"
            aria-disabled={false}
          >
            <span>{o.label}</span>
          </div>
        )}
      </Search>
    </div>
  );
}
