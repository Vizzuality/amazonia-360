"use client";

import {
  ColumnDef,
  TableOptions,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { LuArrowUpDown } from "react-icons/lu";

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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableOptions?: Partial<TableOptions<TData>>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableOptions,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    ...tableOptions,
  });

  const { pageIndex } = table.getState().pagination;

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

        <footer className="flex shrink-0 items-center justify-between">
          <TableTotal
            total={data.length}
            pageIndex={pageIndex}
            pageSize={table.getState().pagination.pageSize}
          />
          {/* <p className="text-xs font-medium text-gray-500">{`${data.length} ${Pluralize(t("result"), data.length)}`}</p> */}
          <DataPagination
            pageIndex={pageIndex}
            pageCount={table.getPageCount()}
            totalPagesToDisplay={5}
            onPagePrevious={table.previousPage}
            onPageNext={table.nextPage}
            onPageIndex={table.setPageIndex}
          />
        </footer>
      </div>
    </div>
  );
}
