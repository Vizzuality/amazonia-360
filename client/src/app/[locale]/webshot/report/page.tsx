"use client";

import { useMemo, Fragment } from "react";

import { useLocale } from "next-intl";

import { useDocumentPages } from "@/lib/hooks/use-document-pages";
import { useGetTopics } from "@/lib/topics";

import { useSyncLocation, useSyncTopics } from "@/app/store";
import { SupportedLocales } from "@/app/types";

import PdfHeader from "@/containers/header/pdf-header";
import DocumentCoverPdfSection from "@/containers/webshot/pdf-report/document-cover-pdf-section";
import GeographicContextPdfSection from "@/containers/webshot/pdf-report/geographic-context/geographic-context-pdf-section";
import TopicCover from "@/containers/webshot/pdf-report/topic-cover";
import WidgetTopicSection from "@/containers/webshot/pdf-report/widget-topic-section";
import { WebshotReportContainer } from "@/containers/webshot/webshot-report-container";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function WebshotReport() {
  const locale = useLocale();
  const localeString = locale as SupportedLocales;
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
          <DocumentCoverPdfSection title={location?.custom_title} selectedTopics={selectedTopics} />
        </WebshotReportContainer>
        <WebshotReportContainer>
          <PdfHeader
            title={location?.custom_title}
            totalPages={totalPages}
            getCurrentPage={getCurrentPage}
            documentHeight={documentHeight}
          />
          <GeographicContextPdfSection />
        </WebshotReportContainer>

        {selectedTopics?.map((topic) => {
          const topicView = topics?.find((t) => t.id === topic.id);
          if (!topic) return null;

          return (
            <>
              <WebshotReportContainer>
                <TopicCover
                  title={topic[`name_${localeString}`]}
                  description={topic.description}
                  header={
                    <PdfHeader
                      title={location?.custom_title}
                      transparent
                      topic={topic[`name_${localeString}`]}
                      totalPages={totalPages}
                      getCurrentPage={getCurrentPage}
                      documentHeight={documentHeight}
                    />
                  }
                />
              </WebshotReportContainer>

              <WidgetTopicSection
                totalPages={totalPages}
                getCurrentPage={getCurrentPage}
                documentHeight={documentHeight}
                topic={topic}
                topicView={topicView}
              />
            </>
          );
        })}
      </SidebarProvider>
    </main>
  );
}
