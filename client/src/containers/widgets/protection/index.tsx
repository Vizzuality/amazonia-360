"use client";

import { useGetTopics } from "@/lib/topics";
import { cn } from "@/lib/utils";

import WidgetsColumn from "@/containers/widgets/column";
import WidgetForestFires from "@/containers/widgets/protection/forest-fires";
import WidgetIndigenousLands from "@/containers/widgets/protection/indigenous-lands";
import WidgetsProtectionMap from "@/containers/widgets/protection/map";
import WidgetProtectedAreas from "@/containers/widgets/protection/protected-areas";
import WidgetsRow from "@/containers/widgets/row";

export default function WidgetsProtection({ index }: { index: number }) {
  const { data: topicsData } = useGetTopics();
  const T = topicsData?.find((t) => t.id === 5);

  return (
    <div className="container print:break-before-page">
      <h2 className="mb-4 text-xl">{T?.name}</h2>
      <WidgetsRow>
        <WidgetsColumn
          className={cn(
            "col-span-12 lg:col-span-6 print:col-span-12",
            index % 2 !== 0 && "lg:order-2",
          )}
        >
          <WidgetsRow>
            <WidgetsColumn className="col-span-12 md:col-span-6">
              <WidgetForestFires />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12 md:col-span-6">
              <WidgetIndigenousLands />
            </WidgetsColumn>
            <WidgetsColumn className="col-span-12">
              <WidgetProtectedAreas />
            </WidgetsColumn>
          </WidgetsRow>
        </WidgetsColumn>

        <WidgetsColumn className="col-span-12 lg:col-span-6 print:col-span-12">
          <WidgetsProtectionMap />
        </WidgetsColumn>
      </WidgetsRow>
    </div>
  );
}
