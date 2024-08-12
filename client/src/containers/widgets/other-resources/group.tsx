import { useMemo, useState } from "react";

import WidgetsColumn from "@/containers/widgets/column";
import Resource from "@/containers/widgets/other-resources/resource";
import { ResourceProps } from "@/containers/widgets/other-resources/types";
import { DataPagination } from "@/containers/widgets/pagination";
import WidgetsRow from "@/containers/widgets/row";

export default function OtherResourcesGroup({ data }: { data?: ResourceProps[] }) {
  const rowsPerPage = 8;
  const [page, setPage] = useState(0);
  const DATA = useMemo(() => {
    if (!data) return [];

    return data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [data, page]);

  return (
    <div className="space-y-4">
      <WidgetsRow className="print:grid-cols-2">
        {DATA?.map((r, idx) => (
          <WidgetsColumn
            className="col-span-3 print:col-span-1 print:[&:nth-child(7n)]:break-before-page"
            key={idx}
          >
            <Resource key={idx} {...r} />
          </WidgetsColumn>
        ))}
      </WidgetsRow>

      <div className="flex justify-start">
        <DataPagination
          pageIndex={page}
          pageCount={Math.ceil((data?.length || 0) / rowsPerPage) || 1}
          totalPagesToDisplay={5}
          onPagePrevious={() => {
            setPage(page - 1);
          }}
          onPageNext={() => {
            setPage(page + 1);
          }}
          onPageIndex={(p) => {
            setPage(p);
          }}
        />
      </div>
    </div>
  );
}
