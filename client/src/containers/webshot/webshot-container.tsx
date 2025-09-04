"use client";

import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { VisualizationTypes } from "@/types/indicator";
import { useSyncTopics } from "@/app/store";
import { useLocale } from "next-intl";
import { useGetIndicatorsId } from "@/lib/indicators";

export interface WebshotContainerProps {
  type: VisualizationTypes;
  id: number;
  children: ReactNode;
}

export const WebshotContainer = ({ children, type, id }: WebshotContainerProps) => {
  const locale = useLocale();
  const indicator = useGetIndicatorsId(id, locale);
  const topics = useSyncTopics();

  // Calculate dimensions based on ResponsiveReactGridLayout's configuration
  const calculateDimensions = () => {
    const topicIndex = topics?.[0]?.findIndex((topic) => topic?.id === indicator?.topic.id);
    const indicatorDimensions = topics[0]?.[topicIndex || 0]?.indicators?.find(
      (ind) => ind.id === id && ind.type === type,
    );

    // Get dimensions from URL search params if available

    const rowHeight = 122; // Same as ResponsiveReactGridLayout
    const cols = 4; // Same as ResponsiveReactGridLayout for most breakpoints

    // Use a container width that matches the actual report container
    // This should match the responsive container width used in the application
    const containerWidth = 1200; // Approximate container width for desktop
    const columnWidth = containerWidth / cols;

    const width = (indicatorDimensions?.w || 2) * columnWidth;
    const height = (indicatorDimensions?.h || 2) * rowHeight;

    return { width, height };
  };

  const { width, height } = calculateDimensions();

  return (
    <div
      id="webshot-widget-container"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {children}
    </div>
  );
};
