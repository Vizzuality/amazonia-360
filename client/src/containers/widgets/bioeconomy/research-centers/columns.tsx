"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LuFolderSearch } from "react-icons/lu";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type ResearchCenter = {
  FID: string;
  Country: string;
  Org_Name: string;
  Sector: string;
  Focus: string;
};

export const columns: ColumnDef<ResearchCenter>[] = [
  {
    accessorKey: "Org_Name",
    header: "Name",
    sortingFn: "alphanumericCaseSensitive",
    cell(props) {
      const v = props.getValue<string>();
      return (
        <div className="flex space-x-2">
          <LuFolderSearch className="text-cyan-600 mt-px shrink-0" />
          <span>{v}</span>
        </div>
      );
    },
    minSize: 250,
  },
  {
    accessorKey: "Sector",
    header: "Sector",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 130,
  },
  {
    accessorKey: "Focus",
    header: "Focus",
    sortingFn: "alphanumericCaseSensitive",
    minSize: 130,
  },
];
