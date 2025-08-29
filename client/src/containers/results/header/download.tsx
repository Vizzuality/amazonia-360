"use client";

import { useSearchParams } from "next/navigation";

import { FileDown } from "lucide-react";
import { useLocale } from "next-intl";

import { downloadBlobResponse, usePostWebshotReportMutation } from "@/lib/webshot";

import { Button } from "@/components/ui/button";

export default function ReportButton() {
  const locale = useLocale();
  const searchParams = useSearchParams();

  const postWebshotReportMutation = usePostWebshotReportMutation();

  const handleClick = () => {
    postWebshotReportMutation.mutate(
      {
        pagePath: `/${locale}/report/results/?${searchParams.toString()}`,
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
      className="space-x-2 border-none px-2.5 py-2 shadow-none"
      onClick={handleClick}
      disabled={postWebshotReportMutation.isPending}
    >
      {postWebshotReportMutation.isPending ? (
        <span>Generating Report...</span>
      ) : (
        <FileDown className="h-4 w-4" />
      )}
    </Button>
  );
}
