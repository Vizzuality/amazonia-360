"use client";

import { useSyncDatasets } from "@/app/store";

import Layers from "@/containers/layers";
import Search from "@/containers/search";
import Sketch from "@/containers/sketch";
import Test from "@/containers/test";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar() {
  const [datasets] = useSyncDatasets();

  return (
    <aside className="flex flex-col w-[600px] shrink-0 max-h-screen bg-white overflow-hidden">
      <ScrollArea className="grow w-full">
        <div className="space-y-6 p-4 overflow-hidden">
          <Search />

          <Sketch />

          <Layers />

          {datasets.toReversed().map((d) => (
            <Test key={d} id={d} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
