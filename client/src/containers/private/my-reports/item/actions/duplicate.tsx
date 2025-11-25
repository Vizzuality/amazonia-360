"use client";

import { useLocale } from "next-intl";
import { LuCopy } from "react-icons/lu";
import { toast } from "sonner";

import { useDuplicateReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";

import { DropdownMenuItem } from "@/components/ui/dropdown";

import type { ReportActionsProps } from "./types";

export const DuplicateAction = ({ report }: ReportActionsProps) => {
  const locale = useLocale();
  const duplicateMutation = useDuplicateReport();

  const handleDuplicate = () => {
    if (!report.location) return;

    // Generate title with smart copy numbering
    const generateCopyTitle = (originalTitle: string | null | undefined) => {
      if (!originalTitle) return null;

      // Check if title already ends with (Copy) or (Copy N)
      const copyRegex = /\(Copy(?:\s+(\d+))?\)$/;
      const match = originalTitle.match(copyRegex);

      if (match) {
        // Extract base title and increment copy number
        const baseTitle = originalTitle.replace(copyRegex, "").trim();
        const copyNumber = match[1] ? parseInt(match[1], 10) + 1 : 2;
        return `${baseTitle} (Copy ${copyNumber})`;
      }

      // First copy
      return `${originalTitle} (Copy)`;
    };

    const data = {
      title: generateCopyTitle(report.title),
      description: report.description || null,
      topics: report.topics as TopicView[],
      location: report.location,
      locale,
      status: report._status,
    };

    toast.promise(duplicateMutation.mutateAsync(data), {
      loading: "Duplicating report...",
      success: "Report duplicated successfully!",
      error: "Failed to duplicate the report.",
    });
  };

  return (
    <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
      <LuCopy className="mr-2 h-4 w-4" />
      <span>Duplicate</span>
    </DropdownMenuItem>
  );
};
