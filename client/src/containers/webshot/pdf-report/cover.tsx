"use client";

import { useMemo } from "react";

import Image from "next/image";
import { useParams } from "next/navigation";

import { useLocale, useTranslations } from "next-intl";

import { useReport } from "@/lib/report";
import { useGetTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/(frontend)/store";

export default function DocumentCoverPdfSection() {
  const locale = useLocale();
  const t = useTranslations();

  const { id: reportId } = useParams();
  const { data: reportData } = useReport({ id: `${reportId}` });

  const [topics] = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics?.find((t) => t.topic_id === topic.id)),
    [allTopics, topics],
  );

  const dateString = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [locale]);

  const formattedTopicsNames = useMemo(() => {
    if (!selectedTopics || selectedTopics.length === 0) return "";
    const conjunction = t("conjunction-and");
    const topicNames = selectedTopics.map((topic) => topic.name?.toLowerCase());

    if (selectedTopics.length === 1) {
      return ` ${conjunction} ${selectedTopics[0]?.name?.toLowerCase()}`;
    }

    if (selectedTopics.length === 2) {
      return ` ${topicNames[0]} ${conjunction} ${topicNames[1]}`;
    }

    // For 3 or more topics: "topic1, topic2, and topic3"
    const lastTopic = topicNames.pop();
    return `, ${topicNames.join(", ")}, ${conjunction} ${lastTopic}`;
  }, [selectedTopics, t]);

  return (
    <div className="relative w-full grow">
      <div className="absolute bottom-[60px] z-10 flex w-2/3 flex-col gap-8 bg-blue-700 px-14 py-10">
        <h1 className="text-6xl text-white">{reportData?.title || t("pdf-report-cover-title")}</h1>

        <p className="font-normal text-white">
          {t("pdf-report-cover-subtitle", { topics: formattedTopicsNames })}
        </p>

        <p className="font-normal text-white">
          {t("pdf-report-cover-date", { date: dateString, language: "English" })}
        </p>
      </div>

      <Image
        className="absolute left-0 top-0 z-0 h-full w-full object-cover"
        src="/images/report/world-globe.webp"
        alt=""
        role="presentation"
        width={1684}
        height={1084}
        priority
      />
    </div>
  );
}
