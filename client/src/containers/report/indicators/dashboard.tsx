"use client";

import type { GridStackOptions } from "gridstack";

import { GridstackGrid } from "@/lib/dynamic-grid/gridstack-grid";

export const GridContainer = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const gridOptions: GridStackOptions = {
    column: 4,
    acceptWidgets: false,
    removable: false,
    itemClass: "grid-stack-item",
    staticGrid: false,
    cellHeight: "100px",
    margin: 8,
    minRow: 3,
    placeholderClass: "grid-stack-placeholder-custom",
  };
  return (
    <GridstackGrid id={id} options={gridOptions}>
      {children}
    </GridstackGrid>
  );
};

export default GridContainer;
