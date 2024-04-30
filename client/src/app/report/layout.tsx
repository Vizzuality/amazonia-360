import FeedbackButton from "@/containers/report/feedback";

export default await function ReportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}

      <FeedbackButton />
    </>
  );
};
