"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LuCoins } from "react-icons/lu";

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
          <LuCoins className="text-cyan-600 mt-px shrink-0" />
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
    maxSize: 100,
  },
  {
    accessorKey: "totalamount",
    header: "Funding",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 150,
    cell(props) {
      const v = props.getValue<number>();
      return <span>{formatCurrency(v)}</span>;
    },
  },
];
