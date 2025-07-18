import ReportPDFContent from "./content";

export default async function ReportPDFPage({ params }: { params: Promise<{ location: string }> }) {
  await params;
  return <ReportPDFContent />;
}
