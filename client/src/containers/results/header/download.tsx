"use client";

import { useState } from "react";

import { Download } from "lucide-react";
import { useLocale } from "next-intl";

import { usePostWebshotReportMutation } from "@/lib/webshot";

import { Button } from "@/components/ui/button";

export default function ReportButton() {
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  const locale = useLocale();

  const postWebshotReportMutation = usePostWebshotReportMutation();

  const handleClick = () => {
    setStatus("pending");

    postWebshotReportMutation.mutate(
      {
        pagePath: `/${locale}/webshot/pdf`,
        generatedTextContent: {
          2: "Dynamic text content for section 2",
          5: "Dynamic text content for section 5",
        }, // Optional: Add any dynamic text content here
      },
      {
        onSettled: () => {
          setStatus("idle");
        },
        onError: (error) => {
          console.error("Error generating Report:", error);
          setStatus("idle");
        },
        onSuccess: async (data) => {
          console.info(data);
          // const contentDisposition = data.headers["content-disposition"];
          // const filename = filenameFromCD(contentDisposition) || "report.pdf";

          // if (data?.data) {
          //   await downloadBlobResponse(data?.data, filename);
          // }
        },
      },
    );
  };

  return (
    <Button
      variant="outline"
      className="space-x-2"
      onClick={handleClick}
      disabled={status === "pending"}
    >
      {status === "pending" ? <span>Generating Report...</span> : <Download className="h-5 w-5" />}
    </Button>
  );
}
