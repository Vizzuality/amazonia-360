"use client";

import { LuMapPin, LuCalendar } from "react-icons/lu";

import { isFeatureEnabled } from "@/lib/feature-flags";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MyReportsItemSkeleton = () => {
  return (
    <Card className="group relative flex flex-col gap-1 overflow-hidden border-0 shadow-none after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-border">
      <div className="flex grow flex-col space-y-3 px-5 pt-5 pb-2">
        <div className="space-y-4">
          {isFeatureEnabled("country-module") && <Skeleton className="h-6 w-32 rounded-md" />}
          <Skeleton className="h-6 w-3/4" />
        </div>

        <div className="flex h-6 items-center gap-3.5 text-muted-foreground">
          <div className="flex items-center gap-1">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex items-center gap-1">
            <LuCalendar className="h-4 w-4 shrink-0" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>

      <div className="h-[200px] w-full shrink-0 border-t border-border">
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </Card>
  );
};

export default MyReportsItemSkeleton;
