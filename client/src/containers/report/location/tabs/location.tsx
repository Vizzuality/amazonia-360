"use client";

import { cn } from "@/lib/utils";

import { useSyncLocation } from "@/app/store";

import { Media } from "@/containers/media";
import Confirm from "@/containers/report/location/confirm";
import AmazoniaGridIntro from "@/containers/report/location/grid-intro";
import SearchLocation from "@/containers/report/location/search";
import Sketch from "@/containers/report/location/sketch";

export default function TabsLocation() {
  const [location] = useSyncLocation();

  return (
    <div
      className={cn({
        "relative space-y-4 overflow-hidden rounded-lg bg-white py-4": true,
        "lg:border lg:border-blue-100 lg:p-4": true,
      })}
    >
      <div className="space-y-1">
        <h1 className="text-lg font-bold text-primary">Get insights on your area of interest</h1>

        <p className="text-sm font-medium text-muted-foreground">
          Select your area of interest to get started and access a customized report with insights
          tailored to your selection.
        </p>
      </div>

      {!location && (
        <div className="space-y-4">
          <SearchLocation />

          <Media greaterThanOrEqual="lg">
            <Sketch />
          </Media>
        </div>
      )}

      {location && <Confirm />}
      {location && (
        <>
          <Media greaterThanOrEqual="lg">
            <div className="h-[1px] w-full bg-blue-100" />
            <AmazoniaGridIntro />
          </Media>
        </>
      )}
    </div>
  );
}
