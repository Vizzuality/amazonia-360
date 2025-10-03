"use client";

import { useLocale } from "next-intl";

import { useGetDefaultTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/store";

import ReportResultsContentItem from "@/containers/results/content/item";

export default function ReportResultsContentList() {
  const locale = useLocale();
  const [topics] = useSyncTopics();
  const { data: topicsData } = useGetDefaultTopics({ locale });

  return (
    <div className="space-y-20">
      {topicsData
        ?.filter((topic) => topics?.some((t) => t.id === topic.id))
        ?.map((topic) => {
          const t = topics?.find((t) => t.id === topic.id);

          if (!t) return null;

          return <ReportResultsContentItem editable key={t.id} topic={t} />;
        })}
    </div>
  );
}
