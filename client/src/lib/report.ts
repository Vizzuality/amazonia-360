import { useQuery } from "@tanstack/react-query";

import { IndicatorView } from "@/app/(frontend)/parsers";

import { sdk } from "@/services/sdk";

export const findFirstAvailablePosition = (
  parsedTopics: IndicatorView[],
  widgetSize: { w: number; h: number },
  numCols: number,
) => {
  let x = 0;
  let y = 0;

  while (true) {
    const collision = parsedTopics.some(
      (widget) =>
        widget &&
        widget.x !== undefined &&
        widget.x < x + widgetSize.w &&
        widget.w !== undefined &&
        x < widget.x + widget.w &&
        widget.y !== undefined &&
        widget.y < y + widgetSize.h &&
        widget.h !== undefined &&
        y < widget.y + widget.h,
    );

    if (!collision) {
      break;
    }

    x += widgetSize.w;

    if (x + widgetSize.w > numCols) {
      x = 0;
      y++;
    }
  }
  return { x, y };
};

export const reportQueryOptions = (params: { id: number }) => ({
  queryFn: () =>
    sdk.findByID({
      collection: "reports",
      id: params.id,
    }),
  queryKey: ["report", params.id] as const,
});

export const useReport = (params: { id: number }) => {
  return useQuery(reportQueryOptions(params));
};
