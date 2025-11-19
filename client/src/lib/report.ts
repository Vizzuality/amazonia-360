import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Locale, useLocale } from "next-intl";

import { IndicatorView, Location, TopicView } from "@/app/(frontend)/parsers";

import { Report } from "@/payload-types";

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

export const parseTopicViews = (topics: TopicView[]): Report["topics"] => {
  return topics.map((topic) => ({
    ...topic,
    id: `${topic.id}`,
    indicators:
      topic.indicators?.map((indicator) => ({
        ...indicator,
        id: `${indicator.id}`,
      })) ?? [],
  }));
};

export const reportQueryOptions = (params: { id: number; locale: Locale }) => ({
  queryFn: () =>
    sdk.findByID({
      collection: "reports",
      id: params.id,
      locale: params.locale,
    }),
  queryKey: ["report", params.id, params.locale] as const,
});

export const useReport = (params: { id: number }) => {
  const locale = useLocale();
  return useSuspenseQuery(reportQueryOptions({ ...params, locale }));
};

export type ReportDataBase = {
  title: string | null;
  topics: TopicView[];
  location: Location | null;
  locale: Locale;
};

export type SaveReport = ReportDataBase & {
  id: number;
};

export const useSaveReport = () => {
  return useMutation({
    mutationFn: (data: SaveReport) => {
      if (!data.id || !data.location) {
        return Promise.reject(new Error("Report ID and location are required to save the report."));
      }

      return sdk.update({
        collection: "reports",
        id: data.id,
        data: {
          title: data.title,
          location: data.location,
          topics: parseTopicViews(data.topics),
        },
        locale: data.locale,
      });
    },
  });
};

export const useDuplicateReport = () => {
  return useMutation({
    mutationFn: (data: ReportDataBase) => {
      if (!data.location) {
        return Promise.reject(new Error("Location is required to duplicate the report."));
      }

      return sdk.create({
        collection: "reports",
        data: {
          title: data.title,
          location: data.location,
          topics: parseTopicViews(data.topics),
        },
        locale: data.locale,
      });
    },
  });
};
