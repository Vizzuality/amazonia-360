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

    const data = {
      title: report.title ? `${report.title} (Copy)` : null,
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
    <DropdownMenuItem onClick={handleDuplicate}>
      <LuCopy className="mr-2 h-4 w-4" />
      <span>Duplicate</span>
    </DropdownMenuItem>
  );
};
