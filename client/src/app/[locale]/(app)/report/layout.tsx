import FeedbackButton from "@/containers/report/feedback";

export default await function ReportLayout({ children }: LayoutProps<"/[locale]/report">) {
  return (
    <>
      <FeedbackButton />
      <main className="relative top-16 flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
        {children}
      </main>
    </>
  );
};
