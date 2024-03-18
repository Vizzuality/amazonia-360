"use client";

import { useSyncDatasets } from "@/app/store";

import Layers from "@/containers/layers";
import Search from "@/containers/search";
import Sketch from "@/containers/sketch";
import Test from "@/containers/test";

import ArcChart from "@/components/charts/arc";
import MarimekkoChart from "@/components/charts/marimekko";
import { ScrollArea } from "@/components/ui/scroll-area";

const DATA = [
  { id: "Land cover", parent: null, size: 0 },
  { id: "Agriculture", parent: "Land cover", size: 10949 },
  {
    id: "Water bodies and protected wetlands",
    parent: "Land cover",
    size: 3300,
  },
  {
    id: "Built up areas & Infrastructure",
    parent: "Land cover",
    size: 2888,
  },
  { id: "Forests", parent: "Land cover", size: 7647 },
  {
    id: "Bare high Slopes",
    parent: "Land cover",
    size: 1554,
  },
];

export default function Sidebar() {
  const [datasets] = useSyncDatasets();

  return (
    <aside className="flex flex-col w-1/2 shrink-0 max-h-screen bg-white overflow-hidden">
      <ScrollArea className="grow w-full">
        <div className="space-y-6 p-4 overflow-hidden">
          <Search />

          <Sketch />

          <ArcChart value={0.84} />

          <MarimekkoChart data={DATA} />

          <Layers />

          {datasets.toReversed().map((d) => (
            <Test key={d} id={d} />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
