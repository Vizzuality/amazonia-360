import ReportMap from "@/containers/report/map";

export default await function ReportNewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ReportMap />
    </>
  );
};
