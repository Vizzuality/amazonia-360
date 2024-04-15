"use client";

import React, { useMemo } from "react";

import { HtmlLabel } from "@visx/annotation";
import { Group } from "@visx/group";
import { Treemap, hierarchy, stratify, treemapSquarify } from "@visx/hierarchy";
import { useParentSize } from "@visx/responsive";
import { ScaleTypeToD3Scale } from "@visx/scale";

import { useFormatPercentage } from "@/lib/formats";
import { cn, getContrastColor } from "@/lib/utils";

export const background = "#00152E"; // navy

type Data = {
  id: string;
  label: string;
  parent: string | null;
  size: number | null;
};

interface MarimekkoChartProps<DataT extends Data> {
  data: DataT[];
  colorScale: ScaleTypeToD3Scale<string, DataT>["ordinal"];
}
const MarimekkoChart = <T extends Data>({
  data = [],
  colorScale,
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

  const { format } = useFormatPercentage({
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-2">
      <div ref={parentRef} className="w-full h-52">
        <svg width={width} height={height}>
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
                            {nodeWidth > 50 && nodeHeight > 50 && (
                              <p
                                className={cn(
                                  "font-bold",
                                  getContrastColor(colorScale(node.data.data)) >
                                    0.5
                                    ? "text-foreground"
                                    : "text-white",
                                )}
                              >
                                {format(
                                  (node.value || 0) / (node.parent?.value || 1),
                                )}
                              </p>
                            )}

                            {nodeWidth > 120 && nodeHeight > 50 && (
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
    </div>
  );
};

export default MarimekkoChart;
