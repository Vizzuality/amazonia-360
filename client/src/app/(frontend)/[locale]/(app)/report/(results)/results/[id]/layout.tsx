import { ReportProvider } from "@/containers/providers/localstorage";
import ReportMap from "@/containers/report/map";

export default async function ReportNewLayout({
  children,
  params,
}: LayoutProps<"/[locale]/report/results/[id]">) {
  const { id } = await params;
  return (
    <ReportProvider id={id}>
      {children}
      <ReportMap />
    </ReportProvider>
  );
}
