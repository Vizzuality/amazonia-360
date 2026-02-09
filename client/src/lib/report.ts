import { useMemo } from "react";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { Locale, useLocale } from "next-intl";

import { IndicatorView, Location, TopicView } from "@/app/(frontend)/parsers";

import { routing } from "@/i18n/routing";
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
    id: `${topic.topic_id}-${crypto.randomUUID()}`,
    indicators:
      topic.indicators?.map((indicator) => ({
        ...indicator,
        id: `${indicator.indicator_id}-${crypto.randomUUID()}`,
      })) ?? [],
  }));
};

export const reportQueryOptions = (params: { id: string; locale: Locale }) => ({
  queryFn: () =>
    sdk.findByID({
      collection: "reports",
      id: params.id,
      locale: params.locale,
    }),
  queryKey: ["report", params.id, params.locale] as const,
});

export const useReport = (params: { id: string }) => {
  const locale = useLocale();
  return useSuspenseQuery(reportQueryOptions({ ...params, locale }));
};

export type ReportDataBase = {
  title?: string | null;
  description?: string | null;
  topics?: TopicView[];
  location?: Location | null;
  status?: "published" | "draft" | null;
};

export type SaveReport = ReportDataBase & {
  id?: string;
};

export const useSaveReport = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: SaveReport) => {
      if (!session) {
        const res = await signIn("anonymous-users", { redirect: false });

        if (!res.ok) {
          throw new Error("Failed to sign in anonymously");
        }
      }

      if (!data.id) {
        if (!data.location) {
          throw new Error("Location is required to create the report.");
        }
        return sdk.create({
          collection: "reports",
          data: {
            title: data.title,
            description: data.description,
            location: data.location,
            topics: parseTopicViews(data.topics ?? []),
            _status: session?.user.collection === "users" ? "published" : "draft",
          },
          locale: routing.defaultLocale, // Save in default locale so every locale can access the same report
          // TODO: Consider saving in the current locale instead and handle localization of reports properly
        });
      }

      return sdk.update({
        collection: "reports",
        id: data.id,
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description && { description: data.description }),
          ...(data.location && { location: data.location }),
          ...(data.topics && { topics: parseTopicViews(data.topics) }),
          ...(data.status && { _status: data.status }),
        },
        locale: routing.defaultLocale, // Save in default locale so every locale can access the same report
        // TODO: Consider saving in the current locale instead and handle localization of reports properly
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["report", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
};

export const useDuplicateReport = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async (data: ReportDataBase) => {
      if (!data.location) {
        return Promise.reject(new Error("Location is required to duplicate the report."));
      }

      if (!session) {
        const res = await signIn("anonymous-users", { redirect: false });

        if (!res.ok) {
          throw new Error("Failed to sign in anonymously");
        }
      }

      return sdk.create({
        collection: "reports",
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          topics: parseTopicViews(data.topics ?? []),
          _status: session?.user.collection === "users" ? data.status : "draft",
        },
        locale: routing.defaultLocale, // Save in default locale so every locale can access the same report
        // TODO: Consider saving in the current locale instead and handle localization of reports properly
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["report", data.id] });
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: Report["id"]) => {
      if (!id) {
        return Promise.reject(new Error("ID is required to delete the report."));
      }

      return sdk.delete({
        collection: "reports",
        id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reports"] });
    },
  });
};

export const useCanEditReport = (reportId?: string | null) => {
  const { data: session } = useSession();
  const { data: reportData } = useReport({ id: `${reportId}` });

  const REPORT_USER_ID = useMemo(() => {
    if (!reportData || !reportData.user?.value) return null;

    const v = reportData.user.value;
    if (typeof v !== "string") return v.id;
    return v;
  }, [reportData]);

  if (!reportId) return false;

  // if (session?.user.collection === "anonymous-users" || !session?.user) {
  //   return true;
  // }

  return String(REPORT_USER_ID) === session?.user.id;
};
