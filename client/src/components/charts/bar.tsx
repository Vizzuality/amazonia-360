"use client";

import { useMemo } from "react";

import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";

export type BarChartProps = {
  data: {
    id: string | number;
    x: number;
    y: number;
    label: string;
    color: string;
  }[];
};

export default function BarChart({ data }: BarChartProps) {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const xScale = useMemo(() => {
    return scaleLinear<number>({
      domain: [0, 1],
      range: [0, width - (data.length - 2)],
    });
  }, [data, width]);

  const yScale = useMemo(() => {
    return scaleLinear<number>({
      domain: [0, 1],
      range: [0, height],
      clamp: true,
    });
  }, [height]);

  return (
    <div ref={parentRef} className="w-full h-12 relative">
      <svg width={width} height={height}>
        <Group top={0} left={0}>
          {data.map((d, i) => {
            const w = xScale(d.x);
            const h = yScale((i + 1) / data.length);

            const x = xScale(
              data.slice(0, i).reduce((acc, curr) => acc + curr.x, 0),
            );
            const y = height - h;

            return (
              <rect
                key={d.id}
                x={x}
                y={y}
                width={w < 1 ? 1 : w}
                height={h}
                fill={d.color}
              />
            );
          })}
        </Group>
      </svg>
    </div>
  );
}
