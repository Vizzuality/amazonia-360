"use client";

import {
  ColumnDef,
  RowData,
  TableOptions,
  columnSizingFeature,
  columnVisibilityFeature,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { LuArrowUpDown } from "react-icons/lu";
import { useTranslations } from "use-intl";

import { cn } from "@/lib/utils";

import { DataPagination } from "@/containers/widgets/table/pagination";
import { TableTotal } from "@/containers/widgets/table/total";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const dataTableFeatures = tableFeatures({
  columnSizingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime, text: sortFn_text },
});

export type DataTableFeatures = typeof dataTableFeatures;

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  tableOptions?: Partial<TableOptions<DataTableFeatures, TData>>;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  tableOptions,
}: DataTableProps<TData>) {
  "use no memo";
  const t = useTranslations();

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    ...tableOptions,
  });

  const { pageIndex } = table.state.pagination;

  return (
    <div className="h-full overflow-hidden">
      <div className="flex h-full grow flex-col justify-between gap-2 overflow-hidden rounded-md print:min-h-0">
        <ScrollArea className="w-full">
          <Table className="border-foreground">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-white">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center space-x-1",
                              header.column.getCanSort() &&
                                "cursor-pointer select-none hover:underline",
                            )}
                            style={{ width: `${header.getSize()}px` }}
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() === "desc"
                                    ? "Sort descending"
                                    : "Clear sort"
                                : undefined
                            }
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getIsSorted() && (
                              <LuArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t("no-results")}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {!!data.length && (
          <footer className="flex shrink-0 flex-col items-center justify-between gap-2 lg:flex-row">
            <TableTotal
              total={data.length}
              pageIndex={pageIndex}
              pageSize={table.state.pagination.pageSize}
            />

            <DataPagination
              pageIndex={pageIndex}
              pageCount={table.getPageCount()}
              totalPagesToDisplay={5}
              onPagePrevious={table.previousPage}
              onPageNext={table.nextPage}
              onPageIndex={table.setPageIndex}
            />
          </footer>
        )}
      </div>
    </div>
  );
}
