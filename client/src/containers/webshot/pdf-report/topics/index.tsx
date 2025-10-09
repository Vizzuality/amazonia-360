"use client";

import { useMemo, Fragment } from "react";

import { useLocale } from "next-intl";

import { useGetTopics } from "@/lib/topics";

import { useSyncTopics } from "@/app/store";

import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfTopicCover from "@/containers/webshot/pdf-report/topics/cover";
import PdfTopicSection from "@/containers/webshot/pdf-report/topics/section";

export default function PdfTopics() {
  const locale = useLocale();

  const [topics] = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics?.find((t) => t.id === topic.id)),
    [allTopics, topics],
  );

  return (
    <>
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
    </>
  );
}
