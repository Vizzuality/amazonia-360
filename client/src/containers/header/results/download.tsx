"use client";

import { useSearchParams } from "next/navigation";

import { FileDown } from "lucide-react";

import { usePostWebshotReportMutation } from "@/lib/webshot";

import { Button } from "@/components/ui/button";

import { Link } from "@/i18n/navigation";

export default function ReportButton() {
  const searchParams = useSearchParams();

  const postWebshotReportMutation = usePostWebshotReportMutation();

  return (
    <Link href={`/webshot/report/?${searchParams.toString()}`} target="_blank">
      <Button
        variant="outline"
        className="space-x-2 border-none px-2.5 py-2 shadow-none"
        // onClick={handleClick}
        disabled={postWebshotReportMutation.isPending}
      >
        {postWebshotReportMutation.isPending ? (
          <span>Generating Report...</span>
        ) : (
          <FileDown className="h-5 w-5" />
        )}
      </Button>
    </Link>
  );
}
