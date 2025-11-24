"use client";

import { useLocale } from "next-intl";
import {
  LuEye,
  LuCopy,
  LuShare2,
  LuDownload,
  LuTextCursorInput,
  LuTrash,
  LuEllipsisVertical,
} from "react-icons/lu";
import { toast } from "sonner";

import { useDuplicateReport, useDeleteReport } from "@/lib/report";

import { TopicView } from "@/app/(frontend)/parsers";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

import { Report } from "@/payload-types";

interface ReportActionsProps {
  report: Report;
}

export const ReportActions = ({ report }: ReportActionsProps) => {
  const locale = useLocale();
  const duplicateMutation = useDuplicateReport();
  const deleteMutation = useDeleteReport();

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

  const handleShare = () => {
    // TODO: Implement share logic
    console.log("Share report:", report.id);
  };

  const handleRename = () => {
    // TODO: Implement rename logic
    console.log("Rename report:", report.id);
  };

  const handleDelete = () => {
    toast.promise(deleteMutation.mutateAsync(report.id), {
      loading: "Deleting report...",
      success: "Report deleted successfully!",
      error: "Failed to delete the report.",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <LuEllipsisVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a
            href={`/report/${report.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center"
          >
            <LuEye className="mr-2 h-4 w-4" />
            <span>View report</span>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <LuCopy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleShare}>
          <LuShare2 className="mr-2 h-4 w-4" />
          <span>Share</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`/webshot/report/${report.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex cursor-pointer items-center"
          >
            <LuDownload className="mr-2 h-4 w-4" />
            <span>Download</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleRename}>
          <LuTextCursorInput className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <LuTrash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
