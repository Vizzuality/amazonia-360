"use client";

import React, { useMemo, useRef } from "react";

import { HtmlLabel } from "@visx/annotation";
import { localPoint } from "@visx/event";
import { Group } from "@visx/group";
import { Treemap, hierarchy, stratify, treemapSquarify } from "@visx/hierarchy";
import { HierarchyNode, HierarchyRectangularNode, TileMethod } from "@visx/hierarchy/lib/types";
import { useParentSize } from "@visx/responsive";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";
import CHROMA from "chroma-js";

import { cn, getTextSize } from "@/lib/utils";

export const background = "#00152E"; // navy

export type Data = {
  id: string;
  label: string;
  parent: string | null;
  size: number;
  color: string;
  percentage?: number;
};

interface MarimekkoChartProps<DataT extends Data> {
  data: DataT[];
  className?: string;
  format: (node: HierarchyRectangularNode<HierarchyNode<DataT>>) => string;
  tile?: TileMethod<HierarchyNode<DataT>> | undefined;
}

const MarimekkoChart = <T extends Data>({
  data = [],
  className = "h-52",
  format,
  tile,
}: MarimekkoChartProps<T>) => {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const DATA = useMemo(() => {
    const d1 = [...data];
    if (!d1.find((d) => d.id === "root")) {
      d1.unshift({
        id: "root",
        parent: null,
        size: 0,
        label: "Root",
      } as T);
    }

    return stratify<T>()
      .id((d) => d.id)
      .parentId((d) => d.parent)(d1)
      .sum((d) => d.size ?? 0);
  }, [data]);

  const margin = { top: 0, left: 0, right: 0, bottom: 0 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const root = hierarchy(DATA);

  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } =
    useTooltip<HierarchyRectangularNode<HierarchyNode<T>>>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const tooltipTimeoutRef = useRef<number | null>(null);

  const isVisible = (node: HierarchyRectangularNode<HierarchyNode<T>>) => {
    const nodeWidth = node.x1 - node.x0;
    const nodeHeight = node.y1 - node.y0;
    const padding = 24;

    const { width: idWidth, height: idHeight } = getTextSize({
      text: node.data.data.label ?? "",
      maxWidth: nodeWidth,
      padding,
      font: "500 14px / 20px __Montserrat_6f749a, __Montserrat_Fallback_6f749a",
    });
    const { width: valueWidth, height: valueHeight } = getTextSize({
      text: format(node),
      maxWidth: nodeWidth,
      padding,
    });

    return {
      id: nodeWidth - padding * 2 >= idWidth && nodeHeight - padding * 2 >= idHeight + valueHeight,
      value: nodeWidth - padding * 2 >= valueWidth && nodeHeight - padding * 2 >= valueHeight,
    };
  };

  return (
    <div className="flex grow flex-col space-y-2 overflow-hidden">
      <div
        ref={parentRef}
        className={cn({
          "w-full": true,
          [className]: !!className,
        })}
      >
        <svg width={width} height={height} ref={containerRef}>
          <Treemap<typeof DATA>
            root={root}
            size={[xMax, yMax]}
            paddingInner={2}
            tile={tile ?? treemapSquarify}
            round
          >
            {(treemap) => (
              <Group>
                {treemap.descendants().map((node) => {
                  const nodeWidth = node.x1 - node.x0;
                  const nodeHeight = (node.y1 - node.y0) * (node.data.data?.percentage || 1);

                  const { id: idVisible, value: valueVisible } = isVisible(node);

                  return (
                    <Group key={node.data.id}>
                      {node.depth === 1 && (
                        <rect
                          width={nodeWidth}
                          height={nodeHeight}
                          x={node.x0}
                          y={node.y0 + (node.y1 - node.y0 - nodeHeight)}
                          rx={4}
                          ry={4}
                          // fill={colorScale(node.value).hex()}
                          fill={node.data.data.color}
                          onMouseLeave={() => {
                            tooltipTimeoutRef.current = window.setTimeout(() => {
                              hideTooltip();
                            }, 200);
                          }}
                          onMouseMove={(event) => {
                            if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);

                            const eventSvgCoords = localPoint(event);

                            showTooltip({
                              tooltipData: node,
                              tooltipTop: eventSvgCoords?.y,
                              tooltipLeft: eventSvgCoords?.x,
                            });
                          }}
                        />
                      )}

                      {node.depth === 1 && (
                        <HtmlLabel
                          x={node.x0}
                          y={node.y0}
                          horizontalAnchor="start"
                          verticalAnchor="start"
                          showAnchorLine={false}
                          containerStyle={{
                            width: nodeWidth,
                            height: nodeHeight,
                          }}
                        >
                          <div className="max-w-52 p-3">
                            {valueVisible && (
                              <p
                                className={cn(
                                  "font-bold",
                                  CHROMA(node.data.data.color).luminance() > 0.5
                                    ? "text-foreground"
                                    : "text-white",
                                )}
                              >
                                {format && format(node)}
                              </p>
                            )}

                            {idVisible && valueVisible && (
                              <p
                                className={cn(
                                  "text-sm font-medium text-white",
                                  CHROMA(node.data.data.color).luminance() > 0.5
                                    ? "text-foreground"
                                    : "text-white",
                                )}
                              >
                                {node.data.data.label}
                              </p>
                            )}
                          </div>
                        </HtmlLabel>
                      )}
                    </Group>
                  );
                })}
              </Group>
            )}
          </Treemap>
        </svg>
      </div>
      {tooltipOpen &&
        tooltipData &&
        (!isVisible(tooltipData).id || !isVisible(tooltipData).value) && (
          <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
            <div className="flex flex-col space-y-1 text-sm text-blue-900">
              <p className="font-bold">{tooltipData.data.data.label}</p>
              <p>{format(tooltipData)}</p>
            </div>
          </TooltipInPortal>
        )}
    </div>
  );
};

export default MarimekkoChart;
