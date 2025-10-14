import Pdf from "@/containers/webshot/pdf-report";

export const metadata = {
  title: "Report - Amazonia 360",
  description: "Generate a PDF report of your current map view.",
};

export default function WebshotReport() {
  return (
    <main className="relative">
      <Pdf />
    </main>
  );
}
