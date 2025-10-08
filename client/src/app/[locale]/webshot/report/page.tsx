"use client";

import { useMemo, Fragment } from "react";

import { useLocale } from "next-intl";

import { useDocumentPages } from "@/lib/hooks/use-document-pages";
import { useGetTopics } from "@/lib/topics";

import { useSyncLocation, useSyncTopics } from "@/app/store";

import PdfCover from "@/containers/webshot/pdf-report/cover";
import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfHeader from "@/containers/webshot/pdf-report/header";
import PdfTopicCover from "@/containers/webshot/pdf-report/topics/cover";
import PdfTopicSection from "@/containers/webshot/pdf-report/topics/section";
import { WebshotReportContainer } from "@/containers/webshot/webshot-report-container";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function WebshotReport() {
  const locale = useLocale();
  const [location] = useSyncLocation();

  const [topics] = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics?.find((t) => t.id === topic.id)),
    [allTopics, topics],
  );

  const { documentRef, totalPages, getCurrentPage, documentHeight } = useDocumentPages();

  return (
    <main className="relative flex w-full flex-col border border-blue-500" ref={documentRef}>
      <SidebarProvider>
        <WebshotReportContainer>
          <PdfHeader
            title={location?.custom_title}
            totalPages={totalPages}
            getCurrentPage={getCurrentPage}
            documentHeight={documentHeight}
          />
          <PdfCover title={location?.custom_title} selectedTopics={selectedTopics} />
        </WebshotReportContainer>

        <WebshotReportContainer>
          <PdfHeader
            title={location?.custom_title}
            totalPages={totalPages}
            getCurrentPage={getCurrentPage}
            documentHeight={documentHeight}
          />
          <PfdGeographicContext />
        </WebshotReportContainer>

        {selectedTopics?.map((topic) => {
          const topicView = topics?.find((t) => t.id === topic.id);
          if (!topic) return null;

          return (
            <Fragment key={topic.id}>
              <WebshotReportContainer cover>
                <PdfHeader
                  title={location?.custom_title}
                  transparent
                  topic={topic.name}
                  totalPages={totalPages}
                  getCurrentPage={getCurrentPage}
                  documentHeight={documentHeight}
                />
                <PdfTopicCover {...topic} />
              </WebshotReportContainer>

              <PdfTopicSection
                totalPages={totalPages}
                getCurrentPage={getCurrentPage}
                documentHeight={documentHeight}
                topic={topic}
                topicView={topicView}
              />
            </Fragment>
          );
        })}
      </SidebarProvider>
    </main>
  );
}
