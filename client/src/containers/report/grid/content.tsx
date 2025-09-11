"use client";

import { useSearchParams } from "next/navigation";

import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { LuArrowLeft } from "react-icons/lu";

import { selectedFiltersViewAtom } from "@/app/store";

import GridFooter from "@/containers/report/grid/footer";
import GridIndicatorsList from "@/containers/report/grid/list";
import GridSearch from "@/containers/report/grid/search";
import GridTopicsList from "@/containers/report/grid/topics";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Link } from "@/i18n/navigation";

export default function SidebarGridContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();

  const selectedFiltersView = useAtomValue(selectedFiltersViewAtom);

  return (
    <div className="relative flex h-full grow flex-col space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white py-6 backdrop-blur-xl xl:space-y-4">
      <div className="space-y-2 px-6">
        <div className="flex items-center justify-between">
          <header className="flex items-start gap-2">
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
              <Link
                href={`/report${searchParams ? `?${searchParams.toString()}` : ""}`}
                className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
              >
                <LuArrowLeft className="h-4 w-4" />
              </Link>
              {t("grid-sidebar-grid-filters-title")}
            </h1>
          </header>
        </div>

        <p className="text-sm font-medium text-muted-foreground">
          {t("grid-sidebar-grid-filters-description")}
        </p>
      </div>

      <div className="px-6">
        <GridSearch className="py-0" />
      </div>

      <div className="relative flex grow flex-col overflow-hidden">
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2.5 bg-gradient-to-b from-white to-transparent" />
        <ScrollArea className="flex grow flex-col">
          <div className="px-6">
            {!selectedFiltersView && <GridTopicsList />}
            {selectedFiltersView && <GridIndicatorsList />}
          </div>
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
      </div>

      <div className="px-6">
        <GridFooter />
      </div>
    </div>
  );
}
