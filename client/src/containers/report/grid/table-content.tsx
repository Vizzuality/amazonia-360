"use client";

import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { gridPanelAtom, useSyncGridDatasets } from "@/app/store";

import GridTable from "@/containers/report/grid/table";

export default function SidebarGridTableContent() {
  const t = useTranslations();
  const setGridPanel = useSetAtom(gridPanelAtom);

  const [gridDatasets] = useSyncGridDatasets();

  return (
    <div className="relative h-full space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-6 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <header className="flex items-start gap-2">
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
              <button
                onClick={() => setGridPanel("filters")}
                className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
              >
                <LuArrowLeft className="h-4 w-4" />
              </button>
              {t("grid-sidebar-ranking-tab")}
            </h1>
          </header>
        </div>

        {!!gridDatasets.length && (
          <p className="text-sm font-medium text-muted-foreground">
            {t("grid-sidebar-grid-filters-ranking-description")}
          </p>
        )}
      </div>
      <div className="relative overflow-y-auto overflow-x-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-2.5 bg-gradient-to-b from-white to-transparent" />

        <div className="-mx-4 h-full max-h-[calc(100vh-64px-44px-216px)] overflow-y-auto px-4 py-1">
          <GridTable />
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
