"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LuTrees } from "react-icons/lu";

import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

export const columns: ColumnDef<ProtectedAreas>[] = [
  {
    accessorKey: "NAME",
    header: "Protected area",
    sortingFn: "alphanumericCaseSensitive",
    cell(props) {
      const v = props.getValue<string>();
      return (
        <div className="flex space-x-2">
          <LuTrees className="text-cyan-600 mt-px shrink-0" />
          <span>{v}</span>
        </div>
      );
    },
    minSize: 250,
  },
  {
    accessorKey: "DESIG_ENG",
    header: "Designation",
    sortingFn: "alphanumericCaseSensitive",
    size: 200,
  },
  {
    accessorKey: "IUCN_CAT",
    header: "Category",
    sortingFn: "alphanumericCaseSensitive",
    size: 130,
  },
];
