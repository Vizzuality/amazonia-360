"use client";

import { LuMapPin, LuCalendar } from "react-icons/lu";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MyReportsItemSkeleton = () => {
  return (
    <Card className="group flex flex-col overflow-hidden">
      <div className="flex grow flex-col p-6">
        {/* Header */}
        <div className="mb-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="w-3/4">
              <Skeleton className="h-6 w-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>

        {/* Metadata */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuMapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LuCalendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Map preview skeleton */}
        <div className="relative h-48 w-full overflow-hidden rounded-sm">
          <Skeleton className="h-full w-full rounded-sm" />
        </div>
      </div>
    </Card>
  );
};

export default MyReportsItemSkeleton;
