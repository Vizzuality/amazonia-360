"use client";

import { MyReportsFooter } from "@/containers/private/my-reports/footer";
import { MyReportsHeader } from "@/containers/private/my-reports/header";
import { useMyReports } from "@/containers/private/my-reports/hooks";
import { MyReportsList } from "@/containers/private/my-reports/list";
import { MyReportsSearch } from "@/containers/private/my-reports/search";

export const MyReports = () => {
  const {
    data,
    isLoading,
    search,
    setSearch,
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

      <MyReportsSearch search={search} onSearchChange={setSearch} />

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
