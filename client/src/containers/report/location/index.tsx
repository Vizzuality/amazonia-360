"use client";

import { useAtom } from "jotai";
import { LuArrowLeft } from "react-icons/lu";

import {
  tabAtom,
  useSyncLocation,
  gridPanelAtom,
  reportPanelAtom,
  useSyncGridDatasets,
} from "@/app/store";

import Confirm from "@/containers/report/location/confirm";
import { GenerateReport } from "@/containers/report/location/generate";
import GridFilters from "@/containers/report/location/grid/filters";
import GridTable from "@/containers/report/location/grid/table";
import Search from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";
import Topics from "@/containers/report/location/topics";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportLocation() {
  const [tab, setTab] = useAtom(tabAtom);
  const [reportPanel, setReportPanel] = useAtom(reportPanelAtom);
  const [gridPanel, setGridPanel] = useAtom(gridPanelAtom);

  const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();

  return (
    <aside className="pointer-events-auto flex max-h-screen w-4/12 shrink-0 flex-col overflow-hidden tall:2xl:w-4/12">
      <Tabs
        defaultValue={tab}
        onValueChange={(t) => setTab(t as typeof tabAtom.init)}
        className="flex grow flex-col"
      >
        <TabsList className="mb-2 w-full items-stretch rounded-lg border border-blue-100 bg-muted p-1">
          <TabsTrigger variant="primary" className="w-full" value="contextual-viewer">
            Contextual viewer
          </TabsTrigger>
          <TabsTrigger variant="primary" className="w-full" value="grid">
            Grid
          </TabsTrigger>
        </TabsList>

        <TabsContent className="flex grow flex-col" value="contextual-viewer">
          <ScrollArea className="w-full grow">
            {reportPanel === "location" && (
              <div className="relative space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <h1 className="text-lg font-bold text-primary">Select your area of interest</h1>

                  <p className="text-sm font-medium text-muted-foreground">
                    Use the search or the drawing tools to select your area of interest and get a
                    report on it.
                  </p>
                </div>

                {!location && (
                  <div className="space-y-4">
                    <Search />

                    <Sketch />
                  </div>
                )}

                {location && <Confirm />}
              </div>
            )}

            {reportPanel === "topics" && (
              <div className="relative space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                    <button
                      onClick={() => setReportPanel("location")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50"
                    >
                      <LuArrowLeft className="h-4 w-4" />
                    </button>
                    Select Report topics
                  </h1>

                  <p className="text-sm font-medium text-muted-foreground">
                    Select <strong>one or more topics</strong> on which you want to get information
                    for this area.
                  </p>
                </div>
                <div className="relative max-h-[calc(100vh-420px)]">
                  <div className="pointer-events-none absolute left-0 right-0 top-0 h-2.5 bg-gradient-to-b from-white to-transparent" />

                  <div className="max-h-[calc(100vh-420px)] overflow-y-auto py-1">
                    <Topics />
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
                </div>

                <GenerateReport />
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent className="flex grow flex-col" value="grid">
          <ScrollArea className="w-full grow">
            {gridPanel === "filters" && (
              <div className="relative space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                    Filter cells
                  </h1>

                  <p className="text-sm font-medium text-muted-foreground">
                    Select indicators to filter the grid cells displayed on the map. This indicators
                    may differ from the ones in the contextual viewer.
                  </p>
                </div>

                <div className="space-y-5">
                  <GridFilters />
                  <Button
                    onClick={() => setGridPanel("table")}
                    variant="outline"
                    className="w-full"
                    disabled={!gridDatasets?.length}
                  >
                    View cells ranking
                  </Button>
                </div>
              </div>
            )}

            {gridPanel === "table" && (
              <div className="relative space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                    <button
                      onClick={() => setGridPanel("filters")}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50"
                    >
                      <LuArrowLeft className="h-4 w-4" />
                    </button>
                    Cells ranking
                  </h1>

                  <p className="text-sm font-medium text-muted-foreground">
                    Click on a row in the table to redefine your area and center the map on the
                    corresponding cell.
                  </p>
                </div>
                <div className="relative max-h-[50vh]">
                  <div className="pointer-events-none absolute left-0 right-0 top-0 h-2.5 bg-gradient-to-b from-white to-transparent" />

                  <div className="max-h-[50vh] overflow-y-auto py-1">
                    <GridTable />
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
