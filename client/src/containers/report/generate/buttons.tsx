import { useFormContext } from "react-hook-form";

import { useLocale, useTranslations } from "next-intl";
import { LuFileText } from "react-icons/lu";
import { z } from "zod";

import { useSaveReport } from "@/lib/report";
import { useGetDefaultSubtopics } from "@/lib/subtopics";
import { useGetDefaultTopics } from "@/lib/topics";

import { formSchema } from "@/containers/report/generate";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const ReportGenerateButtons = ({
  mutation,
}: {
  mutation?: ReturnType<typeof useSaveReport>;
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const form = useFormContext<z.infer<typeof formSchema>>();

  const { data: topicsData } = useGetDefaultTopics({ locale });
  const { data: subtopicsData } = useGetDefaultSubtopics({ locale });

  return (
    <div className="flex w-full items-center justify-between">
      <div className="flex grow flex-row items-center justify-between gap-2">
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
          disabled={mutation?.isPending}
        >
          {t("select-all")}
        </Button>

        <Button className="space-x-2 px-4 lg:px-8" type="submit" disabled={mutation?.isPending}>
          {!mutation?.isPending && <LuFileText className="h-5 w-5" />}
          {mutation?.isPending && <Spinner className="h-5 w-5" />}

          <span>{t("create")}</span>
        </Button>
      </div>
    </div>
  );
};
