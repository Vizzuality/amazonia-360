"use client";
// gridstack-item.tsx

import * as React from "react";

import type { GridItemHTMLElement, GridStackWidget } from "gridstack";

import { useGridstackContext } from "./use-gridstack-context";

interface GridstackItemComponentProps {
  id: string;
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
  initOptions,
  children,
  className,
}: GridstackItemComponentProps) => {
  const { grid, addItemRefToList, removeItemRefFromList } = useGridstackContext();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<GridStackWidget | undefined>(initOptions);
  const itemRef = React.useRef<GridItemHTMLElement | null>(null);

  // Update the optionsRef when initOptions changes
  React.useEffect(() => {
    optionsRef.current = initOptions;
  }, [initOptions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useLayoutEffect(() => {
    const g = grid;
    if (!g || !containerRef.current) return;
    if (g && containerRef.current) {
      // Initialize the widget

      g?.batchUpdate(true);
      itemRef.current = g?.makeWidget(containerRef.current, optionsRef.current);
      g?.batchUpdate(false);

      addItemRefToList(id, itemRef);
      g?.enable(true);

      // Cleanup function to remove the widget
      return () => {
        if (g && itemRef.current) {
          try {
            g?.batchUpdate(true);
            g?.removeWidget(itemRef.current, false);
            g?.batchUpdate(false);

            removeItemRefFromList(id);
          } catch (error) {
            console.error("Error removing widget", error);
            //! Doing nothing here is a bad practice, but we don't want to crash the app (Temporary fix)
            // Do nothing
          }
        }
      };
    }
  }, [id, grid, addItemRefToList, removeItemRefFromList]);

  return (
    <div ref={containerRef} id={id}>
      <div id={`${id}-contenedor`} className="h-full w-full p-1">
        <div className={`h-full w-full rounded-2xl border border-blue-100 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};