"use client";

import { useMemo } from "react";

import { useLocale, useTranslations } from "next-intl";

import { useGetTopics } from "@/lib/topics";

import { useSyncLocation, useSyncTopics } from "@/app/store";

import { SupportedLocales } from "./geographic-context/components";

export default function DocumentCoverPdfSection() {
  const locale = useLocale();
  const t = useTranslations();
  const localeString = locale as SupportedLocales;
  const [location] = useSyncLocation();

  const dateString = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString(localeString, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [localeString]);

  const topics = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics[0]?.find((t) => t.id === topic.id)),
    [allTopics, topics],
  );

  const formattedTopicsName = useMemo(() => {
    if (!selectedTopics || selectedTopics.length === 0) return "";
    const conjunction = t("conjunction-and");
    const topicNames = selectedTopics.map((topic) => topic[`name_${localeString}`].toLowerCase());

    if (selectedTopics.length === 1) {
      return ` ${conjunction} ${selectedTopics[0][`name_${localeString}`].toLowerCase()}`;
    }

    if (selectedTopics.length === 2) {
      return ` ${topicNames[0]} ${conjunction} ${topicNames[1]}`;
    }

    // For 3 or more topics: "topic1, topic2, and topic3"
    const lastTopic = topicNames.pop();
    return `, ${topicNames.join(", ")}, ${conjunction} ${lastTopic}`;
  }, [selectedTopics, localeString, t]);

  return (
    <div className="relative">
      <div className="absolute bottom-[60px] z-10 flex w-[551px] flex-col gap-8 bg-blue-700 px-14 py-10">
        <h1 className="text-6xl text-white">
          {t("pdf-report-cover-title", { location: location?.custom_title || "Selected Area" })}
        </h1>
        <p className="font-normal text-white">
          {t("pdf-report-cover-subtitle", { topics: formattedTopicsName })}
        </p>
        <p className="font-normal text-white">
          {t("pdf-report-cover-date", { date: dateString, language: "English" })}
        </p>
      </div>
      <img src="/images/report/world-globe.webp" alt="" role="presentation" />
    </div>
  );
}
