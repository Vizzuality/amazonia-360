"use client";

import type { GridStackOptions } from "gridstack";

import { GridstackGrid } from "@/lib/dynamic-grid/gridstack-grid";

export const GridContainer = ({ children }: { children: React.ReactNode }) => {
  return <GridDemo>{children}</GridDemo>;
};

const GridDemo = ({ children }: { children: React.ReactNode }) => {
  const gridOptions: GridStackOptions = {
    column: 4,
    acceptWidgets: false,
    removable: false,
    itemClass: "grid-stack-item",
    staticGrid: false,
    cellHeight: "100px",
    margin: 8,
    minRow: 1,
    placeholderClass: "grid-stack-placeholder-custom",
  };
  return <GridstackGrid options={gridOptions}>{children}</GridstackGrid>;
};

export default GridContainer;
