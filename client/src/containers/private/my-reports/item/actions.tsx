"use client";

import {
  LuEye,
  LuCopy,
  LuShare2,
  LuDownload,
  LuTextCursorInput,
  LuTrash,
  LuEllipsisVertical,
} from "react-icons/lu";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

import { Link } from "@/i18n/navigation";
import { Report } from "@/payload-types";

interface ReportActionsProps {
  report: Report;
}

export const ReportActions = ({ report }: ReportActionsProps) => {
  const handleView = () => {
    // TODO: Implement view report logic
    console.log("View report:", report.id);
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate logic
    console.log("Duplicate report:", report.id);
  };

  const handleShare = () => {
    // TODO: Implement share logic
    console.log("Share report:", report.id);
  };

  const handleDownload = () => {
    // TODO: Implement download logic
    console.log("Download report:", report.id);
  };

  const handleRename = () => {
    // TODO: Implement rename logic
    console.log("Rename report:", report.id);
  };

  const handleDelete = () => {
    // TODO: Implement delete logic
    console.log("Delete report:", report.id);
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
        <DropdownMenuItem onClick={handleView} asChild>
          <Link href={`/report/${report.id}`} className="flex cursor-pointer items-center">
            <LuEye className="mr-2 h-4 w-4" />
            <span>View report</span>
          </Link>
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
        <DropdownMenuItem onClick={handleDownload}>
          <LuDownload className="mr-2 h-4 w-4" />
          <span>Download</span>
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
