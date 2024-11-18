import React, { FC } from "react";

import { Responsive, WidthProvider, ResponsiveProps } from "react-grid-layout";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export const GridLayout: FC<ResponsiveProps> = ({
  className = "layout",
  rowHeight = 122,
  cols = { lg: 4, md: 4, sm: 1, xs: 1, xxs: 1 },
  children,
  isDraggable = false,
  isResizable = false,
  onDrop,
  onDragStop,
  onResizeStop,
}) => (
  <div>
    <ResponsiveReactGridLayout
      className={className}
      rowHeight={rowHeight}
      cols={cols}
      compactType="horizontal"
      isDraggable={isDraggable}
      isResizable={isResizable}
      onDrop={onDrop}
      onDragStop={onDragStop}
      onResizeStop={onResizeStop}
      resizeHandles={["sw", "nw", "se", "ne"]}
      resizeHandle={false}
    >
      {children}
    </ResponsiveReactGridLayout>
  </div>
);

export default GridLayout;
