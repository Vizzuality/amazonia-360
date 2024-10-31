"use client";

import { useAtom } from "jotai";

import { tabAtom } from "@/app/store";

import Confirm from "@/containers/report/location/confirm";
import Search from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportLocation() {
  const [tab, setTab] = useAtom(tabAtom);

  return (
    <aside className="pointer-events-auto flex max-h-screen w-4/12 shrink-0 flex-col overflow-hidden tall:2xl:w-4/12">
      <Tabs defaultValue={tab} onValueChange={(t) => setTab(t)} className="flex grow flex-col">
        <TabsList className="w-full rounded-lg border border-blue-100 bg-muted p-1">
          <TabsTrigger variant="primary" className="w-full" value="contextual-viewer">
            Contextual viewer
          </TabsTrigger>
          <TabsTrigger variant="primary" className="w-full" value="grid">
            Grid
          </TabsTrigger>
        </TabsList>

        <TabsContent className="flex grow flex-col" value="contextual-viewer">
          <ScrollArea className="w-full grow">
            <div className="relative space-y-2 overflow-hidden rounded-lg bg-white p-4 backdrop-blur-xl xl:space-y-4">
              <div className="space-y-2">
                <h1 className="text-lg font-bold text-primary">Select your area of interest</h1>

                <p className="text-sm font-medium text-muted-foreground">
                  Use the search or the drawing tools to select your area of interest and get a
                  report on it.
                </p>
              </div>

              <div className="space-y-2">
                <Search />

                <Sketch />
              </div>

              <Confirm />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="flex grow flex-col" value="grid">
          {tab}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
