"use client";

import { ColumnDef } from "@tanstack/react-table";

import { ProtectedAreas } from "@/containers/widgets/protection/protected-areas/types";

export const columns: ColumnDef<ProtectedAreas>[] = [
  {
    accessorKey: "NAME",
    header: "Protected area",
    sortingFn: "alphanumericCaseSensitive",
  },
  {
    accessorKey: "DESIG_ENG",
    header: "Designation",
    sortingFn: "alphanumericCaseSensitive",
  },
  {
    accessorKey: "IUCN_CAT",
    header: "Category",
    sortingFn: "alphanumericCaseSensitive",
  },
];
