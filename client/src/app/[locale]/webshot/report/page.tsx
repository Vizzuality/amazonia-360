import Header from "@/containers/header";
import DocumentCoverPdfSection from "@/containers/webshot/document-cover-pdf-section";
import GeographicContextPdfSection from "@/containers/webshot/geographic-context/geographic-context-pdf-section";
import { WebshotReportContainer } from "@/containers/webshot/webshot-report-container";

import { SidebarProvider } from "@/components/ui/sidebar";

export default function WebshotReport() {
  return (
    <main className="relative flex w-full flex-col">
      <SidebarProvider>
        <WebshotReportContainer>
          <Header withLanguageSelector={false} />
          <DocumentCoverPdfSection />
        </WebshotReportContainer>
        <WebshotReportContainer>
          <Header withLanguageSelector={false} />
          <GeographicContextPdfSection />
        </WebshotReportContainer>
      </SidebarProvider>
    </main>
  );
}
