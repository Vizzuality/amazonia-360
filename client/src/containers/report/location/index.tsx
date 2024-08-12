import Confirm from "@/containers/report/location/confirm";
import Search from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportLocation() {
  return (
    <aside className="pointer-events-auto flex max-h-screen w-4/12 shrink-0 flex-col overflow-hidden tall:2xl:w-5/12">
      <ScrollArea className="w-full grow">
        <div className="relative space-y-2 overflow-hidden rounded-3xl bg-muted/75 p-4 backdrop-blur-xl xl:space-y-4 tall:xl:p-8">
          <div className="space-y-2 p-2 tall:xl:space-y-4">
            <h1 className="text-2xl text-blue-400 lg:text-3xl tall:xl:text-4xl">
              Get insights on your area of interest
            </h1>

            <p className="text-sm font-medium tall:xl:text-base">
              Choose your area of interest: Get a customized report to deepen your understanding of
              your region of interest and guide your efforts towards making a significant impact.
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
