"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LuMapPin } from "react-icons/lu";

import { AdministrativeBoundary } from "@/containers/widgets/overview/administrative-boundaries/types";

export const columns: ColumnDef<AdministrativeBoundary>[] = [
  {
    accessorKey: "NAME_1",
    header: "State",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 150,
    cell(props) {
      const v = props.getValue<string>();
      return (
        <div className="flex space-x-2">
          <LuMapPin className="text-cyan-600 mt-px shrink-0" />
          <span>{v}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "NAME_2",
    header: "Municipality",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 250,
  },
  {
    accessorKey: "NAME_0",
    header: "Country",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 150,
  },
];
