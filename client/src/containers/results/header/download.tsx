"use client";

import { Download } from "lucide-react";
import { useLocale } from "next-intl";

import { downloadBlobResponse, usePostWebshotReportMutation } from "@/lib/webshot";

import { Button } from "@/components/ui/button";

export default function ReportButton() {
  const locale = useLocale();

  const postWebshotReportMutation = usePostWebshotReportMutation();

  const handleClick = () => {
    postWebshotReportMutation.mutate(
      {
        pagePath: `/${locale}/webshot/report`,
      },
      {
        onError: (error) => {
          console.error("Error generating Report:", error);
        },
        onSuccess: async (data) => {
          await downloadBlobResponse(data.data, "report.pdf");
        },
      },
    );
  };

  return (
    <Button
      variant="outline"
      className="space-x-2"
      onClick={handleClick}
      disabled={postWebshotReportMutation.isPending}
    >
      {postWebshotReportMutation.isPending ? (
        <span>Generating Report...</span>
      ) : (
        <Download className="h-5 w-5" />
      )}
    </Button>
  );
}
