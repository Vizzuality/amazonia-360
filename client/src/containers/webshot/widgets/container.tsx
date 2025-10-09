"use client";

import { ReactNode } from "react";

import { VisualizationTypes } from "@/types/indicator";

import { WebshotWidgetDefaultSizes } from "@/constants/webshot";

export interface WebshotContainerProps {
  type: VisualizationTypes;
  children: ReactNode;
}

export const WidgetContainer = ({ children, type }: WebshotContainerProps) => {
  const rowHeight = 122;
  const cols = 4;

  const containerWidth = 1200;
  const columnWidth = containerWidth / cols;
  const { h = 1, w = 1 } = WebshotWidgetDefaultSizes[type];

  return (
    <div
      id="webshot-widget-container"
      style={{
        width: `${w * columnWidth}px`,
        height: `${h * rowHeight}px`,
      }}
    >
      {children}
    </div>
  );
};

export default WidgetContainer;
