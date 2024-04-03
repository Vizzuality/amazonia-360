import Confirm from "@/containers/report/location/confirm";
import Search from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportLocation() {
  return (
    <aside className="flex flex-col w-5/12 shrink-0 max-h-screen overflow-hidden pointer-events-auto">
      <ScrollArea className="grow w-full">
        <div className="relative space-y-4 p-8 overflow-hidden backdrop-blur-xl bg-white/0">
          <h1 className="text-blue-400 text-4xl">
            Knowledge for a thriving Amazonia
          </h1>

          <p className="font-medium">
            Select your location of interest to get a customised report to help
            you better understanding the region and achieve a positive impact.
          </p>

          <p className="font-medium">
            To get start please <strong>search</strong> for a location or use
            one of the <strong>drawing tools</strong>.
          </p>

          <div className="space-y-2">
            <Search />

            <Sketch />
          </div>

          <Confirm />
        </div>
      </ScrollArea>
    </aside>
  );
}
