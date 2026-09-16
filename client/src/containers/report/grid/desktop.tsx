"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { gridPanelAtom } from "@/app/(frontend)/store";

import SidebarGridContent from "@/containers/report/grid/content";
import SidebarGridTable from "@/containers/report/grid/table-content";

import { Button } from "@/components/ui/button";

export default function ReportGridDesktop() {
  const t = useTranslations();
  const [gridPanel, setGridPanel] = useAtom(gridPanelAtom);

  return (
    <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
      <div className="flex max-h-[calc(100vh-(calc(var(--spacing)*16)+calc(var(--spacing)*20)))] grow flex-col">
        <div className="relative flex max-h-full grow flex-col overflow-hidden">
          <Tabs
            value={gridPanel}
            onValueChange={(value) => setGridPanel(value as "filters" | "table")}
            className="relative flex grow flex-col overflow-hidden"
          >
            <TabsList className="border-border bg-secondary absolute top-6 right-6 z-10 space-x-0.5 rounded-lg border p-0.5">
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

            <TabsContent value="filters" className="relative flex grow flex-col overflow-hidden">
              <SidebarGridContent />
            </TabsContent>

            <TabsContent value="table" className="relative flex grow flex-col overflow-hidden">
              <SidebarGridTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </aside>
  );
}
