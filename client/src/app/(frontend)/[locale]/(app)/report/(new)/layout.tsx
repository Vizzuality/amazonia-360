import { ReportProvider } from "@/containers/providers/localstorage";
import ReportMap from "@/containers/report/map";

export default await function ReportNewLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReportProvider id="new">
      {children}
      <ReportMap />
    </ReportProvider>
  );
};
