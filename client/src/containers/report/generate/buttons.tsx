import { useFormContext } from "react-hook-form";

import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";

import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { formSchema } from "@/containers/report/generate";

import { Button } from "@/components/ui/button";

export const ReportGenerateButtons = () => {
  const locale = useLocale();
  const t = useTranslations();
  const form = useFormContext<z.infer<typeof formSchema>>();

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale });

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex grow flex-col items-center justify-between gap-2 lg:flex-row">
        <Button
          type="button"
          className="px-4 lg:px-8"
          variant="outline"
          onClick={() => {
            form.setValue(
              "topics",
              topicsData?.map((topic) => ({
                id: topic.id,
                subtopics:
                  subtopicsData?.filter((s) => s.topic_id === topic.id).map((s) => s.id) || [],
              })) || [],
            );
          }}
        >
          {t("select-all")}
        </Button>

        <Button className="px-4 lg:px-8" type="submit">
          {t("create")}
        </Button>
      </div>
    </div>
  );
};
