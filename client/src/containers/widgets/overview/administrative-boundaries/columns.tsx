"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type AdministrativeBoundary = {
  FID: string;
  GID_0: string;
  NAME_0: string;
  NAME_1: string;
  NAME_2: string;
};

export const columns: ColumnDef<AdministrativeBoundary>[] = [
  {
    accessorKey: "NAME_1",
    header: "State",
    sortingFn: "alphanumericCaseSensitive",
  },
  {
    accessorKey: "NAME_2",
    header: "Municipality",
    sortingFn: "alphanumericCaseSensitive",
  },
  {
    accessorKey: "NAME_0",
    header: "Country",
    sortingFn: "alphanumericCaseSensitive",
  },
];
