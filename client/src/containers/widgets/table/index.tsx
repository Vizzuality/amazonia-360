"use client";

import { useRef } from "react";

import {
  ColumnDef,
  TableOptions,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Pluralize from "pluralize";
import { LuArrowUpDown } from "react-icons/lu";

import { cn } from "@/lib/utils";

import { DataPagination } from "@/containers/widgets/table/pagination";

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
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div className="flex h-full grow flex-col overflow-hidden bg-green-300">
      <div
        ref={containerRef}
        className="flex h-full min-h-80 grow flex-col justify-between overflow-hidden rounded-md bg-violet-300 print:min-h-0"
      >
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
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        ¡{" "}
        <footer className="mt-4 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">{`${data.length} ${Pluralize("result", data.length)}`}</p>
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
