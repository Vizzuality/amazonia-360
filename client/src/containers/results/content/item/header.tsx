"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LuSparkles } from "react-icons/lu";

import { usePostSummaryTopicMutation } from "@/lib/ai";
import { useLocationGeometry } from "@/lib/location";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { Topic } from "@/types/topic";

import { useSyncLocation, useSyncTopics } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";
import { AISummaryForm } from "@/containers/results/content/item/form";
import { ReportResultsSummary } from "@/containers/results/content/item/summary";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const ReportTopicHeader = (props: Topic) => {
  const t = useTranslations();
  const locale = useLocale();

  const { data: session } = useSession();

  const { topics, setTopics } = useSyncTopics();
  const [location] = useSyncLocation();

  const [editing, setEditing] = useState(false);

  const TOPIC_VIEW = topics?.find((t) => t.topic_id === props.id);

  const LOCATION = useLocationGeometry(location);

  const summaryMutation = usePostSummaryTopicMutation({
    onSuccess: (data, variables) => {
      // Update the specific topic's description with the AI-generated result
      if (variables.topic?.id && data?.description) {
        setTopics(
          (currentTopics) =>
            currentTopics?.map((t) =>
              t.topic_id === variables.topic?.id ? { ...t, description: data.description } : t,
            ) || [],
        );
      }
    },
    onError: (error) => {
      console.error("Error generating AI summary:", error);
    },
  });

  const handleSubmit = (values: {
    tone: ContextDescriptionType;
    onlyActiveIndicators: boolean;
  }) => {
    const activeIndicators = TOPIC_VIEW?.indicators?.map(({ indicator_id }) => indicator_id) || [];
    const indicatorsToUse = values.onlyActiveIndicators ? activeIndicators : undefined;

    summaryMutation.mutate({
      topic: props,
      options: {
        type: values.tone,
        enabled: true,
        only_active: values.onlyActiveIndicators,
      },
      locale,
      activeIndicators: indicatorsToUse,
      location: LOCATION,
    });
  };

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-primary">{props.name}</h2>

        <div className="flex gap-2">
          <Popover>
            <AuthWrapper>
              <PopoverTrigger asChild>
                <Button variant="outline" className="hidden gap-2 lg:inline-flex">
                  <LuSparkles />
                  <span>{t("report-results-sidebar-ai-summaries-title")}</span>
                </Button>
              </PopoverTrigger>
            </AuthWrapper>
            <PopoverContent className="w-96 bg-popover" align="end">
              <AISummaryForm
                mutation={summaryMutation}
                onSubmit={(values) => {
                  handleSubmit(values);
                }}
              />
            </PopoverContent>
          </Popover>

          {!editing &&
            TOPIC_VIEW?.description &&
            session?.user &&
            session.user.collection === "users" && (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                disabled={summaryMutation.isPending}
                className="hidden gap-2 lg:inline-flex"
              >
                {t("edit")}
              </Button>
            )}

          {editing && TOPIC_VIEW?.description && (
            <Button
              onClick={() => setEditing(false)}
              variant="default"
              disabled={summaryMutation.isPending}
              className="hidden gap-2 lg:inline-flex"
            >
              {t("save")}
            </Button>
          )}
        </div>
      </header>

      <ReportResultsSummary topic={props} mutation={summaryMutation} editing={editing} />
    </>
  );
};
