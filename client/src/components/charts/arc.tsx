"use client";

import { useMemo } from "react";

import { Group } from "@visx/group";
import { useParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Arc } from "@visx/shape";

import { useFormatPercentage } from "@/lib/formats";

export type ArcChartProps = {
  value: number;
  color?: `#${string}`;
};

export default function ArcChart({ value, color = "#FFDA00" }: ArcChartProps) {
  const { parentRef, width, height } = useParentSize({ debounceTime: 150 });

  const startAngle = -Math.PI / 2;
  const endAngle = Math.PI / 2;

  const xScale = useMemo(() => {
    return scaleLinear<number>({
      domain: [0, 1],
      range: [startAngle, endAngle],
      clamp: true,
    });
  }, [startAngle, endAngle]);

  const { format } = useFormatPercentage({});

  return (
    <div ref={parentRef} className="w-full h-28 relative">
      <svg width={width} height={height}>
        <Group top={height} left={width / 2}>
          <Arc
            startAngle={xScale(0)}
            endAngle={xScale(1)}
            innerRadius={(height * 3) / 4}
            outerRadius={height}
            cornerRadius={height / 4}
            fill={color}
            fillOpacity={0.25}
          />
          <Arc
            startAngle={xScale(0)}
            endAngle={xScale(value)}
            innerRadius={(height * 3) / 4}
            outerRadius={height}
            cornerRadius={height / 4}
            fill={color}
          />
        </Group>
      </svg>
      <span className="absolute top-full left-1/2 block -translate-x-1/2 -translate-y-full text-center text-4xl font-bold">
        {format(value)}
      </span>
    </div>
  );
}
