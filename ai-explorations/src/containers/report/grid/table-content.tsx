"use client";

import { useAtom } from "jotai";
import { LuArrowLeft } from "react-icons/lu";
import { useTranslations } from "use-intl";

import { useSearchParams } from "@/lib/navigation";
import { gridEnabledAtom, useSyncGridDatasets } from "@/lib/url-state/store";

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
                  className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors duration-400 ease-in-out hover:bg-blue-100"
                >
                  <LuArrowLeft className="h-4 w-4" />
                </Link>
              )}
              {gridEnabled && (
                <button
                  type="button"
                  onClick={() => setGridEnabled(false)}
                  className="flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors duration-400 ease-in-out hover:bg-blue-100"
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

      <div className="relative m-0! flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-50 h-2 bg-linear-to-b from-white to-transparent xl:h-4" />
        <ScrollArea className="flex grow flex-col">
          <div className="px-6 py-2 xl:py-4">
            <GridTable />
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-50 h-2 bg-linear-to-t from-white to-transparent xl:h-4" />
      </div>
    </div>
  );
}
