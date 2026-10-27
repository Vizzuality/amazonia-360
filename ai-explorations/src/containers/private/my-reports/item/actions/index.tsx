"use client";

import { LuEllipsisVertical } from "react-icons/lu";
import { useTranslations } from "use-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

import { DeleteAction } from "./delete";
import { DownloadAction } from "./download";
import { DuplicateAction } from "./duplicate";
import { RenameAction } from "./rename";
import { ShareAction } from "./share";
import type { ReportActionsProps } from "./types";
import { ViewAction } from "./view";

export const ReportActions = ({ report }: ReportActionsProps) => {
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-10 shrink-0">
          <LuEllipsisVertical className="size-5" />
          <span className="sr-only">{t("my-reports-action-open-menu")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <ViewAction report={report} />
        <DuplicateAction report={report} />

        <DropdownMenuSeparator />

        <ShareAction report={report} />
        <DownloadAction report={report} />

        <DropdownMenuSeparator />

        <RenameAction report={report} />
        <DeleteAction report={report} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
