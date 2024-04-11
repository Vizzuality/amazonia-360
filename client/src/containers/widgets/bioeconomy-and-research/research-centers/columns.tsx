"use client";

import { ColumnDef } from "@tanstack/react-table";

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
  },
  {
    accessorKey: "Sector",
    header: "Sector",
    sortingFn: "alphanumericCaseSensitive",
  },
  {
    accessorKey: "Focus",
    header: "Focus",
    sortingFn: "alphanumericCaseSensitive",
  },
];
