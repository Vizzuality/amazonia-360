"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { gridPanelAtom } from "@/app/store";

import SidebarGridContent from "@/containers/report/grid/content";
import SidebarGridTable from "@/containers/report/grid/table-content";

import { Button } from "@/components/ui/button";

export default function ReportLocationDesktop() {
  const t = useTranslations();
  const [gridPanel, setGridPanel] = useAtom(gridPanelAtom);

  return (
    <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
      <div className="container grid grid-cols-12">
        <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
          <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
            <div className="flex max-h-[calc(100vh_-_(theme(spacing.16)_+_theme(spacing.20)))] grow flex-col">
              <div className="relative flex max-h-full grow flex-col overflow-hidden">
                <Tabs
                  value={gridPanel}
                  onValueChange={(value) => setGridPanel(value as "filters" | "table")}
                  className="relative flex grow flex-col overflow-hidden"
                >
                  <TabsList className="absolute right-6 top-6 z-10">
                    <TabsTrigger value="filters" asChild>
                      <Button size="sm" variant={gridPanel === "filters" ? "default" : "secondary"}>
                        {t("grid-sidebar-grid-tab")}
                      </Button>
                    </TabsTrigger>
                    <TabsTrigger value="table" asChild>
                      <Button size="sm" variant={gridPanel === "table" ? "default" : "secondary"}>
                        {t("grid-sidebar-ranking-tab")}
                      </Button>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="filters"
                    className="relative flex grow flex-col overflow-hidden"
                  >
                    <SidebarGridContent />
                  </TabsContent>

                  <TabsContent
                    value="table"
                    className="relative flex grow flex-col overflow-hidden"
                  >
                    <SidebarGridTable />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
