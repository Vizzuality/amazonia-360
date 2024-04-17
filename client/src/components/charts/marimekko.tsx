"use client";

import React, { useMemo, useRef } from "react";

import { HtmlLabel } from "@visx/annotation";
import { localPoint } from "@visx/event";
import { Group } from "@visx/group";
import { Treemap, hierarchy, stratify, treemapSquarify } from "@visx/hierarchy";
import {
  HierarchyNode,
  HierarchyRectangularNode,
} from "@visx/hierarchy/lib/types";
import { useParentSize } from "@visx/responsive";
import { ScaleTypeToD3Scale } from "@visx/scale";
import { useTooltip, useTooltipInPortal } from "@visx/tooltip";

import { cn, getContrastColor } from "@/lib/utils";

export const background = "#00152E"; // navy

export type Data = {
  id: string;
  label: string;
  parent: string | null;
  size: number;
  color: string;
};

interface MarimekkoChartProps<DataT extends Data> {
  data: DataT[];
  colorScale: ScaleTypeToD3Scale<string, DataT>["ordinal"];
  className?: string;
  format: (node: HierarchyRectangularNode<HierarchyNode<DataT>>) => string;
}

const MarimekkoChart = <T extends Data>({
  data = [],
  colorScale,
  className = "h-52",
  format,
}: MarimekkoChartProps<T>) => {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const DATA = useMemo(() => {
    const d1 = [...data];
    if (!d1.find((d) => d.id === "root")) {
      d1.unshift({
        id: "root",
        parent: null,
        size: 0,
        label: "Land Cover",
      } as T);
    }

    return stratify<T>()
      .id((d) => d.id)
      .parentId((d) => d.parent)(
        d1.toSorted((a, b) => {
          if (!a.size || !b.size) return 0;

          return a.size - b.size;
        }),
      )
      .sum((d) => d.size ?? 0)
      .sort((a, b) => {
        if (!a.value || !b.value) return 0;

        return b.value - a.value;
      });
  }, [data]);

  const margin = { top: 0, left: 0, right: 0, bottom: 0 };
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const root = hierarchy(DATA);

  const getTextWidth = (text?: string): number => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (context && text) {
      context.font = getComputedStyle(document.body).font;
      const width = context.measureText(text).width + 24;
      canvas.remove();
      return width;
    }
    canvas.remove();
    return 0;
  };

  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  } = useTooltip<HierarchyRectangularNode<HierarchyNode<T>>>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const tooltipTimeoutRef = useRef<number | null>(null);

  const tooltipIsNeeded = (
    node: HierarchyRectangularNode<HierarchyNode<T>>,
  ) => {
    const nodeWidth = node.x1 - node.x0;

    const idWidth = getTextWidth(node.data.id);
    const valueWidth = getTextWidth(format(node));

    const maxWidth = Math.max(idWidth, valueWidth);

    if (nodeWidth > maxWidth) return false;
    if (nodeWidth < maxWidth) return true;
  };

  return (
    <div className="space-y-2">
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
            paddingInner={4}
            tile={treemapSquarify}
            round
          >
            {(treemap) => (
              <Group>
                {treemap.descendants().map((node) => {
                  const nodeWidth = node.x1 - node.x0;
                  const nodeHeight = node.y1 - node.y0;
                  const idWidth = getTextWidth(node.data.id);
                  const valueWidth = getTextWidth(format(node));

                  const maxWidth = Math.max(idWidth, valueWidth);

                  return (
                    <Group key={node.data.id}>
                      {node.depth === 1 && (
                        <rect
                          width={nodeWidth}
                          height={nodeHeight}
                          x={node.x0}
                          y={node.y0}
                          rx={4}
                          ry={4}
                          // fill={colorScale(node.value).hex()}
                          fill={colorScale(node.data.data)}
                          onMouseLeave={() => {
                            tooltipTimeoutRef.current = window.setTimeout(
                              () => {
                                hideTooltip();
                              },
                              200,
                            );
                          }}
                          onMouseMove={(event) => {
                            if (tooltipTimeoutRef.current)
                              clearTimeout(tooltipTimeoutRef.current);

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
                          <div className="p-3 max-w-52">
                            {nodeWidth > maxWidth && nodeHeight > 50 && (
                              <p
                                className={cn(
                                  "font-bold",
                                  getContrastColor(colorScale(node.data.data)) >
                                    0.5
                                    ? "text-foreground"
                                    : "text-white",
                                )}
                              >
                                {format && format(node)}
                              </p>
                            )}

                            {nodeWidth > maxWidth && nodeHeight > 100 && (
                              <p
                                className={cn(
                                  "text-sm font-medium text-white",
                                  getContrastColor(colorScale(node.data.data)) >
                                    0.5
                                    ? "text-foreground"
                                    : "text-white",
                                )}
                              >
                                {node.data.id}
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
      {tooltipOpen && tooltipData && tooltipIsNeeded(tooltipData) && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft}>
          <div className="text-blue-900 flex flex-col space-y-1 text-sm">
            <p className="font-bold">{tooltipData.data.id}</p>
            <p>{format(tooltipData)}</p>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
};

export default MarimekkoChart;
