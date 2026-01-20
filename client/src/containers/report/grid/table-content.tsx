"use client";

import { useSearchParams } from "next/navigation";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { gridEnabledAtom, useSyncGridDatasets } from "@/app/(frontend)/store";

import GridTable from "@/containers/report/grid/table";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

export default function SidebarGridTableContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const [gridDatasets] = useSyncGridDatasets();

  const [gridEnabled, setGridEnabled] = useAtom(gridEnabledAtom);

  return (
    <div className="relative flex h-full grow flex-col space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white py-6 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-2 px-6">
        <div className="flex items-start justify-between">
          <header className="flex items-start gap-2">
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
              {!gridEnabled && (
                <Link
                  href={`/reports${searchParams ? `?${searchParams.toString()}` : ""}`}
                  className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
                >
                  <LuArrowLeft className="h-4 w-4" />
                </Link>
              )}
              {gridEnabled && (
                <button
                  onClick={() => setGridEnabled(false)}
                  className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
                >
                  <LuArrowLeft className="h-4 w-4" />
                </button>
              )}{" "}
              {t("grid-sidebar-grid-filters-title")}
            </h1>
          </header>
        </div>

        {!!gridDatasets.length && (
          <p className="text-sm font-medium text-muted-foreground">
            {t("grid-sidebar-grid-filters-ranking-description")}
          </p>
        )}
      </div>

      <div className="relative !m-0 flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2 bg-gradient-to-b from-white to-transparent xl:h-4" />
        <ScrollArea className="flex grow flex-col">
          <div className="px-6 py-2 xl:py-4">
            <GridTable />
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-2 bg-gradient-to-t from-white to-transparent xl:h-4" />
      </div>
    </div>
  );
}
