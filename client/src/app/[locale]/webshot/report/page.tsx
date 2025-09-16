"use client";

import { useMemo } from "react";

import { useLocale } from "next-intl";

import { useGetTopics } from "@/lib/topics";

import { useSyncLocation, useSyncTopics } from "@/app/store";

import PdfHeader from "@/containers/header/pdf-header";
import DocumentCoverPdfSection from "@/containers/webshot/pdf-report/document-cover-pdf-section";
import GeographicContextPdfSection from "@/containers/webshot/pdf-report/geographic-context/geographic-context-pdf-section";
import TopicCover from "@/containers/webshot/pdf-report/topic-cover";
import { WebshotReportContainer } from "@/containers/webshot/webshot-report-container";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function WebshotReport() {
  const locale = useLocale();
  const [location] = useSyncLocation();

  const topics = useSyncTopics();
  const { data: allTopics } = useGetTopics(locale);

  const selectedTopics = useMemo(
    () => allTopics?.filter((topic) => topics[0]?.find((t) => t.id === topic.id)),
    [allTopics, topics],
  );

  const documentHeight = document.body.scrollHeight;

  // A4 size in pixels at 96 DPI
  const totalPages = useMemo(() => Math.floor(documentHeight / 793.92), [documentHeight]);

  return (
    <main className="relative flex w-full flex-col">
      <SidebarProvider>
        <WebshotReportContainer>
          <PdfHeader title={location?.custom_title} totalPages={totalPages} pageNumber={1} />
          <DocumentCoverPdfSection title={location?.custom_title} selectedTopics={selectedTopics} />
        </WebshotReportContainer>
        <WebshotReportContainer>
          <PdfHeader title={location?.custom_title} totalPages={totalPages} pageNumber={2} />
          <GeographicContextPdfSection />
        </WebshotReportContainer>
        <WebshotReportContainer>
          <TopicCover
            title="Nature"
            description="Population in Amazonia, Conflicts location."
            header={
              <PdfHeader
                title={location?.custom_title}
                transparent
                totalPages={totalPages}
                pageNumber={3}
                topic="Nature"
              />
            }
          />
        </WebshotReportContainer>
      </SidebarProvider>
    </main>
  );
}
