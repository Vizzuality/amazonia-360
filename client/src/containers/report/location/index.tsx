"use client";

import { useCallback } from "react";

import { useAtom } from "jotai";
import { LuArrowLeft } from "react-icons/lu";

import { useGetGridMeta } from "@/lib/grid";
import { useGetDefaultTopics } from "@/lib/topics";

import {
  tabAtom,
  useSyncLocation,
  gridPanelAtom,
  reportPanelAtom,
  useSyncGridDatasets,
  useSyncTopics,
} from "@/app/store";

import Confirm from "@/containers/report/location/confirm";
import { GenerateReport } from "@/containers/report/location/generate";
import GridFilters from "@/containers/report/location/grid/filters";
import SearchIndicators from "@/containers/report/location/grid/filters/search";
import GridFiltersControls from "@/containers/report/location/grid/filters-controls";
import GridTable from "@/containers/report/location/grid/table";
import GridTableSetup from "@/containers/report/location/grid/table/setup";
import AmazoniaGridIntro from "@/containers/report/location/grid-intro";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";
import Topics from "@/containers/report/location/topics";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import GridClearFilters from "./grid/filters-controls/clear";

export default function ReportLocation() {
  const [tab, setTab] = useAtom(tabAtom);
  const [reportPanel, setReportPanel] = useAtom(reportPanelAtom);
  const [gridPanel, setGridPanel] = useAtom(gridPanelAtom);

  const [location] = useSyncLocation();
  const [gridDatasets] = useSyncGridDatasets();
  const [activeTopics, setTopics] = useSyncTopics();

  const { data: topics } = useGetDefaultTopics();

  const { data: rankingCriterion } = useGetGridMeta({
    select: (data) => data?.datasets?.find((d) => d.var_name === gridDatasets[0])?.label,
  });

  const handleTopicsSelection = useCallback(() => {
    if (topics?.length === activeTopics?.length) {
      setTopics([]);
    } else {
      if (topics) {
        setTopics(
          topics?.map(({ id, default_visualization }) => ({
            id,
            indicators: default_visualization,
          })),
        );
      }
    }
  }, [setTopics, topics, activeTopics]);

  // const HEADER_HEIGHT = 64;
  // const SIDEBAR_TOP_POSITION = 40;
  // const TABS_HEADER_HEIGHT = 28;

  return (
    <aside className="pointer-events-auto flex w-full shrink-0 flex-col overflow-hidden">
      <Tabs
        defaultValue={tab}
        value={tab}
        onValueChange={(t) => setTab(t as typeof tabAtom.init)}
        className="test-class flex max-h-[calc(100vh_-_(64px_+_40px_+_28px))] grow flex-col"
      >
        <TabsList className="mb-2 w-full items-stretch rounded-lg border border-blue-100 bg-muted p-1">
          <TabsTrigger variant="primary" className="w-full" value="contextual-viewer">
            Report
          </TabsTrigger>
          <TabsTrigger variant="primary" className="w-full" value="grid">
            Grid
          </TabsTrigger>
        </TabsList>

        <TabsContent
          className="flex max-h-full grow flex-col overflow-hidden"
          value="contextual-viewer"
        >
          <ScrollArea className="h-full w-full grow">
            {reportPanel === "location" && (
              <div className="relative space-y-4 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <h1 className="text-lg font-bold text-primary">
                    Get insights on your area of interest
                  </h1>

                  <p className="text-sm font-medium text-muted-foreground">
                    Select your area of interest to get started and access a customized report with
                    insights tailored to your selection.
                  </p>
                </div>

                {!location && (
                  <div className="space-y-4">
                    <SearchLocation />

                    <Sketch />
                  </div>
                )}

                {location && <Confirm />}
                {location && <div className="h-[1px] w-full bg-blue-100" />}
                {location && <AmazoniaGridIntro />}
              </div>
            )}

            {reportPanel === "topics" && (
              <div className="relative h-full space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                      <button
                        type="button"
                        onClick={() => setReportPanel("location")}
                        className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
                      >
                        <LuArrowLeft className="h-4 w-4" />
                      </button>
                      Select Report topics
                    </h1>
                    <button
                      type="button"
                      className="whitespace-nowrap text-xs font-bold text-foreground transition-all duration-500 ease-in-out hover:underline"
                      onClick={handleTopicsSelection}
                    >
                      {topics?.length !== activeTopics?.length ? "Select all" : "Unselect all"}
                    </button>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Select <strong>one or more topics</strong> on which you want to get information
                    for this area.
                  </p>
                </div>
                <div className="relative h-full max-h-[calc(100vh_-_(64px_+_40px_+_263px))] overflow-hidden">
                  <div className="max-h-[calc(100vh_-_(64px_+_40px_+_263px))] overflow-y-auto py-1.5">
                    <div className="pointer-events-none absolute left-0 right-0 top-0 h-2 bg-gradient-to-b from-white to-transparent" />
                    <Topics />
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-white to-transparent" />
                  </div>
                </div>

                <GenerateReport />
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent className="flex h-full grow flex-col" value="grid">
          <ScrollArea className="w-full grow">
            {gridPanel === "filters" && (
              <div className="relative h-full space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                      Redefine your area of interest
                    </h1>
                    <GridClearFilters />
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">
                    Add indicators to filter the grid cells and highlight areas that meet specific
                    criteria. You can select a maximum 4 indicators.
                  </p>
                </div>
                <SearchIndicators className="py-0" />

                <GridFiltersControls />

                <div className="space-y-5">
                  <div className="relative h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px))]">
                    <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2.5 bg-gradient-to-b from-white to-transparent" />
                    <div className="h-full max-h-[calc(100vh_-_(64px_+_40px_+_310px_+_46px))] overflow-y-auto px-1 py-1">
                      <GridFilters />
                    </div>
                    <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-2.5 bg-gradient-to-t from-white to-transparent" />
                  </div>

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
              <div className="relative h-full space-y-2 overflow-hidden rounded-lg border border-blue-100 bg-white p-4 backdrop-blur-xl xl:space-y-4">
                <div className="space-y-1">
                  <div className="font-bold text-primary">
                    <div className="flex items-start justify-between gap-2">
                      <header className="flex items-start gap-2">
                        <button
                          onClick={() => setGridPanel("filters")}
                          className="duration-400 flex shrink-0 items-center justify-center rounded-lg bg-blue-50 px-2.5 py-2.5 transition-colors ease-in-out hover:bg-blue-100"
                        >
                          <LuArrowLeft className="h-4 w-4" />
                        </button>
                        <h1 className="mt-1.5">
                          {rankingCriterion
                            ? `Top cells ordered by ${rankingCriterion}`
                            : "Please select filters to view top cells"}
                        </h1>
                      </header>
                      <GridTableSetup />
                    </div>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground">
                    Click on a row in the table to redefine your area and center the map on the
                    corresponding cell.
                  </p>
                </div>
                <div className="relative overflow-y-auto overflow-x-hidden">
                  <div className="pointer-events-none absolute left-0 right-0 top-0 h-2.5 bg-gradient-to-b from-white to-transparent" />

                  <div className="-mx-4 h-full max-h-[calc(100vh-64px-44px-216px)] overflow-y-auto px-4 py-1">
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
