"use client";

import { useParams } from "next/navigation";

import { LuEllipsisVertical } from "react-icons/lu";

import { HelpAction } from "@/containers/results/header/actions/help";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

import { DownloadAction } from "./download";
import { NewReportAction } from "./new";
import { ShareAction } from "./share";

export const ActionsReport = () => {
  const { id } = useParams();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <LuEllipsisVertical className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <NewReportAction />

        <DropdownMenuSeparator />

        <ShareAction reportId={id} />
        <DownloadAction reportId={id} />
        <HelpAction reportId={id} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
