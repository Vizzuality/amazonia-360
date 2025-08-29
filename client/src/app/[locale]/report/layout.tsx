import FeedbackButton from "@/containers/report/feedback";

export default await function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FeedbackButton />
      <main className="relative flex min-h-[calc(100svh_-_theme(space.16))] flex-col">
        {children}
      </main>
    </>
  );
};
