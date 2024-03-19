"use client";

import { useSyncLocation } from "@/app/store";

import Search from "@/containers/search";
import Sketch from "@/containers/sketch";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportLocation() {
  const [location] = useSyncLocation();

  return (
    <aside className="flex flex-col w-5/12 shrink-0 max-h-screen overflow-hidden pointer-events-auto">
      <ScrollArea className="grow w-full">
        <div className="space-y-4 p-4 overflow-hidden">
          <h1 className="text-blue-400 text-4xl">
            Get insights on your area of interest
          </h1>

          <p className="font-medium">
            Select your location of interest to get a customised report to help
            better understanding the region and achieve a positive impact.
          </p>

          <p className="font-medium">
            To get start please <strong>search</strong> for a location or{" "}
            <strong>click on the map</strong> to select your location.
          </p>

          <Search />

          <Sketch />

          {location && (
            <Button size="lg" variant="destructive">
              Confirm location
            </Button>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
