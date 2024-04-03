import Confirm from "@/containers/report/location/confirm";
import Search from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportLocation() {
  return (
    <aside className="flex flex-col w-5/12 shrink-0 max-h-screen overflow-hidden pointer-events-auto">
      <ScrollArea className="grow w-full">
        <div className="relative space-y-4 p-8 overflow-hidden backdrop-blur-xl bg-white/0">
          <div className="p-2 space-y-4">
            <h1 className="text-blue-400 text-4xl">
              Get insights on your area of interest
            </h1>

            <p className="font-medium">
              Choose your area of interest: Get a customized report to deepen
              your understanding of your region of interest and guide your
              efforts towards making a significant impact.
            </p>
          </div>

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
