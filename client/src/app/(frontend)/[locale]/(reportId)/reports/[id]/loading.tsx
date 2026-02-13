import WidgetsColumn from "@/containers/widgets/column";
import WidgetsRow from "@/containers/widgets/row";

import { Skeleton } from "@/components/ui/skeleton";

export default function ReportResultsLoading() {
  return (
    <main className="relative flex min-h-[calc(100svh_-_calc(var(--spacing)*40)_+_1px)] flex-col bg-blue-50 py-12">
      <div className="flex flex-col space-y-6">
        <div className="container">
          <Skeleton className="h-12 w-full" />
        </div>

        <div className="container">
          <div className="space-y-6">
            <WidgetsRow>
              <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3">
                <Skeleton className="h-32 w-full" />
              </WidgetsColumn>
              <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3">
                <Skeleton className="h-32 w-full" />
              </WidgetsColumn>
              <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3">
                <Skeleton className="h-32 w-full" />
              </WidgetsColumn>
              <WidgetsColumn className="col-span-12 md:col-span-6 lg:col-span-3">
                <Skeleton className="h-32 w-full" />
              </WidgetsColumn>
            </WidgetsRow>
            <WidgetsRow>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
            </WidgetsRow>
            <WidgetsRow>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
            </WidgetsRow>
            <WidgetsRow>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
              <WidgetsColumn>
                <Skeleton className="h-96 w-full" />
              </WidgetsColumn>
            </WidgetsRow>
          </div>
        </div>
      </div>
    </main>
  );
}
