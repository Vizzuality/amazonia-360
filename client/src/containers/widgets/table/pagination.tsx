"use client";

import { Table } from "@tanstack/react-table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataPaginationProps<TData> {
  table: Table<TData>;
  totalPagesToDisplay: number;
}

export function DataPagination<TData>({
  table,
  totalPagesToDisplay,
}: DataPaginationProps<TData>) {
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const showLeftEllipsis =
    pageCount > totalPagesToDisplay && pageIndex + 1 > totalPagesToDisplay / 2;
  const showRightEllipsis =
    pageCount > totalPagesToDisplay &&
    pageCount - (pageIndex + 1) > totalPagesToDisplay / 2;

  const getPageNumbers = () => {
    if (pageCount <= totalPagesToDisplay) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    } else {
      const half = Math.floor(totalPagesToDisplay / 2);
      // To ensure that the current page is always in the middle
      let start = pageIndex + 1 - half;
      let end = pageIndex + 1 + half;
      // If the current page is near the start
      if (start < 1) {
        start = 1;
        end = totalPagesToDisplay;
      }
      // If the current page is near the end
      if (end > pageCount) {
        start = pageCount - totalPagesToDisplay + 1;
        end = pageCount;
      }
      // If showLeftEllipsis is true, add an ellipsis before the start page
      if (showLeftEllipsis) {
        start++;
      }
      // If showRightEllipsis is true, add an ellipsis after the end page
      if (showRightEllipsis) {
        end--;
      }
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  };

  const renderPaginationItems = () => {
    const pageNumbers = getPageNumbers();
    return pageNumbers.map((pageNumber) => (
      <PaginationItem key={pageNumber}>
        <PaginationLink
          isActive={pageNumber === pageIndex + 1}
          onClick={() => table.setPageIndex(pageNumber - 1)}
        >
          {pageNumber}
        </PaginationLink>
      </PaginationItem>
    ));
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={pageIndex === 0}
            onClick={() => table.previousPage()}
          />
        </PaginationItem>

        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {renderPaginationItems()}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            disabled={pageIndex === pageCount - 1}
            onClick={() => table.nextPage()}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
