import React, { FC } from "react";

import { Responsive, WidthProvider, ResponsiveProps } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export const GridLayout: FC<ResponsiveProps> = ({
  className = "layout",
  rowHeight = 122,
  cols = { lg: 12, sm: 1 },
  children,
}) => {
  return (
    <div>
      <ResponsiveReactGridLayout
        className={className}
        rowHeight={rowHeight}
        cols={cols}
        // layouts={{ lg: layout || [] }}
        // onLayoutChange={handleLayoutChange}
        measureBeforeMount={false}
        compactType="horizontal"
        preventCollision={true}
        allowOverlap={false}
      >
        {children}
      </ResponsiveReactGridLayout>
    </div>
  );
};

export default GridLayout;
