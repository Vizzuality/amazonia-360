"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

import SidebarClearIndicators from "./clear-indicators";
import Search from "./search";
import TopicsList from "./topics";

export default function IndicatorsSidebarContent() {
  return (
    <div className="relative rounded-md bg-white shadow-md">
      <div className="relative h-full">
        <div className="py-2">
          <div className="flex w-full items-center justify-between">
            <h3 className="text-2xl text-primary">Report indicators</h3>
          </div>
          <p className="text-sm font-semibold leading-5 text-gray-300">
            Add indicators to your report and view them in various formats—
            <span className="font-bold">map, table, chart, etc.</span>
          </p>
          <Search />
        </div>

        <div className="mb-4 flex w-full justify-end pr-2">
          <SidebarClearIndicators />
        </div>

        <div className="relative flex h-full w-full grow">
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 h-2 bg-gradient-to-b from-white to-transparent" />

          <ScrollArea className="h-screen max-h-[calc(100vh-285px)] w-[calc(100%+40px)]">
            <TopicsList />
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
