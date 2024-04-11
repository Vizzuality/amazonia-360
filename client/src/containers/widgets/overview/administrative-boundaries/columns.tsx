"use client";

import { ColumnDef } from "@tanstack/react-table";

import { AdministrativeBoundary } from "@/containers/widgets/overview/administrative-boundaries/types";

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
