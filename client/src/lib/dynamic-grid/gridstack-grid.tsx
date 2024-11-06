// gridstack-context.tsx
"use client";

import * as React from "react";

import { GridStack, type GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack-extra.css";
import "gridstack/dist/gridstack.css";

import { useGridstackContext } from "./use-gridstack-context";

// Create a context for the GridStack instance

export const GridstackGrid = ({
  id,
  options,
  children,
}: {
  id: string;
  options: GridStackOptions;
  children: React.ReactNode;
}) => {
  const { grids, setGrids } = useGridstackContext();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<GridStackOptions>(options);

  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  React.useLayoutEffect(() => {
    if (!grids?.[id] && containerRef.current) {
      const gridInstance = GridStack.init(optionsRef.current, containerRef.current);
      setGrids((prev) => ({ ...prev, [id]: gridInstance }));
    }
    return () => {
      if (grids?.[id]) {
        //   //? grid.destroy(false);
        grids?.[id]?.removeAll(false);
        grids?.[id]?.destroy(false);
        setGrids((prev) => ({ ...prev, [id]: null }));
      }
    };
  }, [id, grids, setGrids]);

  return <div ref={containerRef}>{children}</div>;
};
