"use client";

import { useState } from "react";

import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { LuSparkles } from "react-icons/lu";

import { getTopicSummaryStamp, useGetTopicSummary } from "@/lib/ai";
import { useLocationGeometry } from "@/lib/location";

import { ContextDescriptionType } from "@/types/generated/api.schemas";
import { Topic } from "@/types/topic";

import { useFormTopics, useFormLocation } from "@/app/(frontend)/store";

import { AuthWrapper } from "@/containers/auth/wrapper";
import { AISummaryForm } from "@/containers/results/content/item/form";
import { ReportResultsSummary } from "@/containers/results/content/item/summary";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const ReportTopicHeader = (props: Topic) => {
  const t = useTranslations();
  const locale = useLocale();

  const { data: session } = useSession();
  const canEdit = session?.user?.collection === "users";

  const { topics, setTopics } = useFormTopics();
  const { location } = useFormLocation();

  const [editing, setEditing] = useState(false);
  // Controlled so the "out of date" notice can open the same popover: regenerating still goes
  // through the tone and scope choices rather than silently reusing whatever ran last time.
  const [settingsOpen, setSettingsOpen] = useState(false);

  const TOPIC_VIEW = topics?.find((t) => t.topic_id === props.id);

  const LOCATION = useLocationGeometry(location);

  const summaryMutation = useGetTopicSummary({
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

    // Taken here rather than in the callback: generation is slow enough for the area to be
    // redrawn while it runs, and the stamp has to describe the report the request went out with.
    const stamp = getTopicSummaryStamp(activeIndicators, location);

    summaryMutation.mutate(
      {
        topic: props,
        options: {
          type: values.tone,
          enabled: true,
          only_active: values.onlyActiveIndicators,
        },
        locale,
        activeIndicators: indicatorsToUse,
        location: LOCATION,
      },
      {
        onSuccess: (data) => {
          if (!data?.description) return;

          setTopics(
            (currentTopics) =>
              currentTopics?.map((t) =>
                t.topic_id === props.id
                  ? { ...t, description: data.description, description_stamp: stamp }
                  : t,
              ) || [],
          );
        },
      },
    );
  };

  return (
    <>
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-primary text-2xl font-semibold">{props.name}</h2>

        <div className="flex gap-2">
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <AuthWrapper>
              <PopoverTrigger asChild>
                <Button variant="outline" className="hidden gap-2 lg:inline-flex">
                  <LuSparkles />
                  <span>{t("report-results-sidebar-ai-summaries-title")}</span>
                </Button>
              </PopoverTrigger>
            </AuthWrapper>
            <PopoverContent className="bg-popover w-96" align="end">
              <AISummaryForm
                mutation={summaryMutation}
                onSubmit={(values) => {
                  handleSubmit(values);
                }}
                onClose={() => setSettingsOpen(false)}
              />
            </PopoverContent>
          </Popover>

          {!editing && TOPIC_VIEW?.description && canEdit && (
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

      <ReportResultsSummary
        topic={props}
        mutation={summaryMutation}
        editing={editing}
        // Withheld from anyone AuthWrapper would send to sign-in instead: opening the popover
        // directly would hand them the Generate button the wrapper exists to gate.
        onRegenerate={canEdit ? () => setSettingsOpen(true) : undefined}
      />
    </>
  );
};
