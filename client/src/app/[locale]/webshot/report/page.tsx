"use client";

import { useMemo, Fragment } from "react";

import { useLocale } from "next-intl";

import { useGetTopics } from "@/lib/topics";

import { useSyncLocation, useSyncTopics } from "@/app/store";

import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopicCover from "@/containers/webshot/pdf-report/topics/cover";
import PdfTopicSection from "@/containers/webshot/pdf-report/topics/section";

export default function WebshotReport() {
  const locale = useLocale();
  const [location] = useSyncLocation();

  const [topics] = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics?.find((t) => t.id === topic.id)),
    [allTopics, topics],
  );

  return (
    <main className="relative flex w-full flex-col border border-blue-500">
      <PdfContainer index={0}>
        <PdfCover title={location?.custom_title} selectedTopics={selectedTopics} />
      </PdfContainer>

      <PdfContainer>
        <PfdGeographicContext />
      </PdfContainer>

      {selectedTopics?.map((topic) => {
        const topicView = topics?.find((t) => t.id === topic.id);
        if (!topic) return null;

        return (
          <Fragment key={topic.id}>
            <PdfContainer cover>
              <PdfTopicCover {...topic} />
            </PdfContainer>

            <PdfTopicSection {...topic} topicView={topicView} />
          </Fragment>
        );
      })}
    </main>
  );
}
