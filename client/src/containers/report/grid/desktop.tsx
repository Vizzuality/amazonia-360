"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

import { gridPanelAtom } from "@/app/store";

import SidebarGridContent from "@/containers/report/grid/content";
import SidebarGridTable from "@/containers/report/grid/table-content";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportLocationDesktop() {
  const t = useTranslations();
  const [gridPanel, setGridPanel] = useAtom(gridPanelAtom);

  return (
    <>
      <div className="pointer-events-none z-10 w-full lg:absolute lg:bottom-8 lg:left-0 lg:top-10">
        <div className="container grid grid-cols-12">
          <div className="col-span-12 space-y-1 lg:col-span-5 2xl:col-span-4">
            <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
              <div className="test-class flex max-h-[calc(100vh_-_(64px_+_40px_+_28px))] grow flex-col">
                <div className="relative flex max-h-full grow flex-col overflow-hidden">
                  <Tabs
                    value={gridPanel}
                    onValueChange={(value) => setGridPanel(value as "filters" | "table")}
                    className="relative"
                  >
                    <TabsList className="absolute right-6 top-6 z-10">
                      <TabsTrigger value="filters" asChild>
                        <Button
                          size="sm"
                          variant={gridPanel === "filters" ? "default" : "secondary"}
                        >
                          {t("grid-sidebar-grid-tab")}
                        </Button>
                      </TabsTrigger>
                      <TabsTrigger value="table" asChild>
                        <Button size="sm" variant={gridPanel === "table" ? "default" : "secondary"}>
                          {t("grid-sidebar-ranking-tab")}
                        </Button>
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-full w-full grow">
                      <TabsContent value="filters">
                        <SidebarGridContent />
                      </TabsContent>

                      <TabsContent value="table">
                        <SidebarGridTable />
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
