import Pdf from "@/containers/webshot/pdf-report";

export const metadata = {
  title: "Report - Amazonia 360",
  description: "Generate a PDF report of your current map view.",
};

export default async function WebshotReport() {
  return (
    <>
      <head>
        <meta name="viewport" content="width=1920px, initial-scale=1" />
      </head>

      <main className="relative bg-gray-500">
        <Pdf />
      </main>
    </>
  );
}
