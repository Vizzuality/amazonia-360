"use client";

import React, { useMemo } from "react";

import { HtmlLabel } from "@visx/annotation";
import { Group } from "@visx/group";
import { Treemap, hierarchy, stratify, treemapDice } from "@visx/hierarchy";
import { useParentSize } from "@visx/responsive";
import { scaleOrdinal } from "@visx/scale";

import { formatPercentage } from "@/lib/formats";

export const background = "#00152E"; // navy

type Data = {
  id: string;
  parent: string | null;
  size: number | null;
};

interface MarimekkoChartProp {
  data: Data[];
}
const MarimekkoChart = ({ data = [] }: MarimekkoChartProp) => {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const DATA = useMemo(() => {
    return stratify<Data>()
      .id((d) => d.id)
      .parentId((d) => d.parent)(
        data.toSorted((a, b) => {
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

  const colorScale = useMemo(() => {
    return scaleOrdinal<string, string>({
      domain: data
        .toSorted((a, b) => {
          if (!a.size || !b.size) return 0;

          return b.size - a.size;
        })
        .map((d) => d.id),
      range: [
        "#2D6485",
        "#35749B",
        "#009ADE",
        "#4BA6DE",
        "#6FB8E5",
        "#93CAEB",
        "#B7DBF2",
        "#DBEDF8",
      ],
    });
  }, [data]);

  const { format } = formatPercentage({
    maximumFractionDigits: 0,
  });

  return (
    <div ref={parentRef} className="w-full h-52">
      <svg width={width} height={height}>
        <Treemap<typeof DATA>
          root={root}
          size={[xMax, yMax]}
          paddingInner={4}
          tile={treemapDice}
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
                        fill={colorScale(`${node.data.id}`)}
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
                        <div className="p-3">
                          <p className="font-bold text-white">
                            {format(
                              (node.value || 0) / (node.parent?.value || 1),
                            )}
                          </p>
                          {nodeWidth > 120 && (
                            <p className="text-sm font-medium text-white">
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
  );
};

export default MarimekkoChart;
