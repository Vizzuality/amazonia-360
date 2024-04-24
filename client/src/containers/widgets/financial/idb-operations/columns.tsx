"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LuPin } from "react-icons/lu";

import { formatCurrency } from "@/lib/formats";

import { IDBOperation } from "@/containers/widgets/financial/types";

export const columns: ColumnDef<IDBOperation>[] = [
  {
    accessorKey: "opername",
    header: "Name",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 250,
    cell(props) {
      const v = props.getValue<string>();
      return (
        <div className="flex space-x-2">
          <LuPin className="text-cyan-600 mt-px shrink-0" />
          <span>{v}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "opertype",
    header: "Type",
    sortingFn: "alphanumericCaseSensitive",
    maxSize: 100,
  },
  {
    accessorKey: "sector",
    header: "Sector",
    sortingFn: "alphanumericCaseSensitive",
    maxSize: 120,
  },
  {
    accessorKey: "idbamount",
    header: "Funding",
    sortingFn: "alphanumericCaseSensitive",
    maxSize: 90,
    cell(props) {
      const v = props.getValue<number>();
      return <span>{formatCurrency(v)}</span>;
    },
  },
];
