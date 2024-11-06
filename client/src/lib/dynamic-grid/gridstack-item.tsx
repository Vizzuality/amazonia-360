"use client";
// gridstack-item.tsx

import * as React from "react";

import type { GridItemHTMLElement, GridStackWidget } from "gridstack";

import { useGridstackContext } from "./use-gridstack-context";

interface GridstackItemComponentProps {
  id: string;
  gridId: string;
  initOptions?: GridStackWidget;
  children: React.ReactNode;
  className?: string;
}

export type ItemRefType = React.MutableRefObject<GridItemHTMLElement | null>;

/**
 * Component for rendering a grid item in a Gridstack layout.
 *
 * @component
 * @param {GridstackItemComponentProps} props - The component props.
 * @param {GridStackWidget} props.initOptions - The initial options for the grid item.
 * @param {string} props.id - The unique identifier for the grid item.
 * @param {ReactNode} props.children - The content to be rendered inside the grid item.
 * @param {string} props.className - The CSS class name for the grid item.
 * @returns {JSX.Element} The rendered grid item component.
 */
export const GridstackItemComponent = ({
  id,
  gridId,
  initOptions,
  children,
  className,
}: GridstackItemComponentProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<GridStackWidget | undefined>(initOptions);
  const { grids, addItemRefToList, removeItemRefFromList } = useGridstackContext();
  const itemRef = React.useRef<GridItemHTMLElement | null>(null);

  // Update the optionsRef when initOptions changes
  React.useEffect(() => {
    optionsRef.current = initOptions;
  }, [initOptions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useLayoutEffect(() => {
    if (!grids?.[gridId] || !containerRef.current) return;
    if (grids?.[gridId] && containerRef.current) {
      // Initialize the widget

      grids?.[gridId]?.batchUpdate(true);
      itemRef.current = grids?.[gridId]?.makeWidget(containerRef.current, optionsRef.current);
      grids?.[gridId]?.batchUpdate(false);

      addItemRefToList(id, gridId, itemRef);

      // Cleanup function to remove the widget
      return () => {
        if (grids?.[gridId] && itemRef.current) {
          try {
            grids?.[gridId]?.batchUpdate(true);
            grids?.[gridId]?.removeWidget(itemRef.current, false);
            grids?.[gridId]?.batchUpdate(false);

            removeItemRefFromList(id, gridId);
          } catch (error) {
            console.error("Error removing widget", error);
            //! Doing nothing here is a bad practice, but we don't want to crash the app (Temporary fix)
            // Do nothing
          }
        }
      };
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grids?.[gridId]]);

  return (
    <div ref={containerRef} id={id}>
      <div
        id={`${id}-contenedor`}
        className={`h-full w-full rounded-2xl border border-blue-100 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
