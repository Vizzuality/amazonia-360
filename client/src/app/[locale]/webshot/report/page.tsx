import PdfContainer from "@/containers/webshot/pdf-report/container";
import PdfCover from "@/containers/webshot/pdf-report/cover";
// import PfdGeographicContext from "@/containers/webshot/pdf-report/geographic-context";
import PdfTopics from "@/containers/webshot/pdf-report/topics";

export default function WebshotReport() {
  return (
    <main className="relative flex w-full flex-col border border-blue-500">
      <PdfContainer index={0}>
        <PdfCover />
      </PdfContainer>

      {/* <PdfContainer>
        <PfdGeographicContext />
      </PdfContainer> */}

      <PdfTopics />
    </main>
  );
}
