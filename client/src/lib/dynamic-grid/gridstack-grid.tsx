// gridstack-context.tsx
"use client";

import * as React from "react";

import { GridStack, type GridStackOptions } from "gridstack";

import { useGridstackContext } from "@/lib/dynamic-grid/use-gridstack-context";

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
  const { grid, itemList, setGrid } = useGridstackContext();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<GridStackOptions>(options);

  // Update the optionsRef when options changes
  React.useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  React.useLayoutEffect(() => {
    const c = containerRef.current;
    if (c && !grid) {
      const g = GridStack.init(optionsRef.current, c);
      setGrid(g);
    }

    return () => {
      if (grid) {
        grid.removeAll(false);
        setGrid(null);
      }
    };
  }, [id, grid, setGrid]);

  React.useLayoutEffect(() => {
    const g = grid;
    if (!g || !containerRef.current) return;

    g.batchUpdate(true);
    g.enableMove(false);
    g.enableResize(false);
    g.batchUpdate(false);

    g.batchUpdate(true);
    g.enableMove(true);
    g.enableResize(true);
    g.batchUpdate(false);

    setGrid(g);
  }, [grid, setGrid, itemList]);

  return (
    <div id={id} ref={containerRef} className="gridstack -mx-1">
      {children}
    </div>
  );
};
