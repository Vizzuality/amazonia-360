"use client";

import { MyReportsFilters } from "@/containers/private/my-reports/filters";
import { MyReportsFooter } from "@/containers/private/my-reports/footer";
import { MyReportsHeader } from "@/containers/private/my-reports/header";
import { useMyReports } from "@/containers/private/my-reports/hooks";
import { MyReportsList } from "@/containers/private/my-reports/list";

export const MyReports = () => {
  const {
    data,
    isLoading,
    search,
    setSearch,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    totalDocs,
    hasNextPage,
    hasPrevPage,
  } = useMyReports();

  return (
    <div className="space-y-6">
      <MyReportsHeader />

      <MyReportsFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />

      <MyReportsList data={data} isLoading={isLoading} />

      <MyReportsFooter
        page={page}
        totalPages={totalPages}
        totalDocs={totalDocs}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        onPageChange={setPage}
      />
    </div>
  );
};
