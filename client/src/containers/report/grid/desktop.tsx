"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom } from "jotai";
import { LucideHelpCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { gridPanelAtom } from "@/app/(frontend)/store";

import SidebarGridContent from "@/containers/report/grid/content";
import SidebarGridTable from "@/containers/report/grid/table-content";

import { Button } from "@/components/ui/button";

const HELP_LINKS = {
  en: "https://rise.articulate.com/share/Nhx1DUq5l0gCFdZJcjdjrXTOkWeaHitu#/?locale=en-us",
  es: "https://rise.articulate.com/share/Nhx1DUq5l0gCFdZJcjdjrXTOkWeaHitu#/",
  pt: "https://rise.articulate.com/share/Nhx1DUq5l0gCFdZJcjdjrXTOkWeaHitu#/?locale=pt-br",
};

export default function ReportGridDesktop() {
  const locale = useLocale();
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
            <div className="absolute top-6 right-6 z-10 flex items-center space-x-1">
              <TabsList className="border-border bg-secondary z-10 space-x-0.5 rounded-lg border p-0.5">
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

              <a href={HELP_LINKS[locale]} target="_blank" rel="noreferrer noopener">
                <Button size="icon" variant="ghost" type="button" className="gap-2">
                  <LucideHelpCircle className="text-secondary-foreground h-4 w-4" />
                </Button>
              </a>
            </div>

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
