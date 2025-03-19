"use client";

import { useAtom, useAtomValue } from "jotai";

import { tabAtom, gridPanelAtom, reportPanelAtom } from "@/app/store";

import TabsFilters from "@/containers/report/location/tabs/filters";
import TabsLocation from "@/containers/report/location/tabs/location";
import TabsTable from "@/containers/report/location/tabs/table";
import TabsTopics from "@/containers/report/location/tabs/topics";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportLocationDesktop() {
  const [tab, setTab] = useAtom(tabAtom);
  const [reportPanel] = useAtom(reportPanelAtom);
  const gridPanel = useAtomValue(gridPanelAtom);

  return (
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
          {reportPanel === "location" && <TabsLocation />}
          {reportPanel === "topics" && <TabsTopics />}
        </ScrollArea>
      </TabsContent>

      <TabsContent className="flex h-full grow flex-col" value="grid">
        <ScrollArea className="w-full grow">
          {gridPanel === "filters" && <TabsFilters />}

          {gridPanel === "table" && <TabsTable />}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
