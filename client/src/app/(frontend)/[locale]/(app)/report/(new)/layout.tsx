import ReportMap from "@/containers/report/map";

export default await function ReportNewLayout({ children }: LayoutProps<"/[locale]/report">) {
  return (
    <>
      {children}
      <ReportMap />
    </>
  );
};
