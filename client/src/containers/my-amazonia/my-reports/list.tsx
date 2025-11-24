import { MyReportsItem } from "@/containers/my-amazonia/my-reports/item";
import { MyReportsItemSkeleton } from "@/containers/my-amazonia/my-reports/item/skeleton";

import { Report } from "@/payload-types";

interface MyReportsListProps {
  data: Report[];
  isLoading: boolean;
}

export const MyReportsList = ({ data, isLoading }: MyReportsListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <MyReportsItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">No reports found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or create a new report
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {data.map((report) => (
        <MyReportsItem key={report.id} report={report} />
      ))}
    </div>
  );
};
